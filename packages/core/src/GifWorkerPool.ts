import { Worker } from 'worker_threads';
import * as os from 'os';

let nextJobId = 1;

export interface GifWorkerPoolOptions {
    size: number;
}

interface JobRequest {
    jobId: number;
    width: number;
    height: number;
    isFast: boolean;
    resolveStart: (session: WorkerSession) => void;
    rejectStart: (err: Error) => void;
}

interface InFlightJob {
    worker: Worker;
    session: WorkerSession;
    resolveStart?: (session: WorkerSession) => void;
    rejectStart?: (err: Error) => void;
}

export class WorkerSession {
    constructor(
        public readonly jobId: number,
        private readonly worker: Worker,
        private readonly pool: GifWorkerPool
    ) {}

    public async addFrame(data: ArrayBuffer, width: number, height: number, delayMs: number): Promise<void> {
        return new Promise((resolve, reject) => {
            this.pool.registerFrameResolver(this.jobId, resolve, reject);
            this.worker.postMessage({ type: 'addFrame', jobId: this.jobId, data, width, height, delay: delayMs });
        });
    }

    public async finish(): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            this.pool.registerFinishResolver(this.jobId, resolve, reject);
            this.worker.postMessage({ type: 'finish', jobId: this.jobId });
        });
    }
}

export class GifWorkerPool {
    private readonly workers: Worker[] = [];
    private readonly idleWorkers: Worker[] = [];
    private readonly fastQueue: JobRequest[] = [];
    private readonly fullQueue: JobRequest[] = [];
    private readonly activeJobs = new Map<number, InFlightJob>();
    
    // Maps for callbacks
    private readonly frameResolvers = new Map<number, { resolve: () => void, reject: (err: Error) => void }>();
    private readonly finishResolvers = new Map<number, { resolve: (buf: Buffer) => void, reject: (err: Error) => void }>();
    
    private readonly maxQueueSize = 100;
    private readonly workerPath: URL;

    constructor(options: GifWorkerPoolOptions) {
        this.workerPath = new URL('./GifWorker.js', import.meta.url);
        
        for (let i = 0; i < options.size; i++) {
            this.spawnWorker();
        }
    }
    
    private spawnWorker() {
        const worker = new Worker(this.workerPath);
        worker.unref(); // Allow Node to exit if only workers remain
        worker.on('message', (msg) => this.handleMessage(worker, msg));
        worker.on('error', (err: any) => this.handleError(worker, err as Error));
        worker.on('exit', () => this.handleExit(worker));
        
        this.workers.push(worker);
        this.idleWorkers.push(worker);
        this.processNext();
    }
    
    private handleMessage(worker: Worker, msg: any) {
        if (msg.type === 'ready') {
            const job = this.activeJobs.get(msg.jobId);
            if (job && job.resolveStart) {
                job.resolveStart(job.session);
                job.resolveStart = undefined;
                job.rejectStart = undefined;
            }
        } else if (msg.type === 'frameAdded') {
            const resolver = this.frameResolvers.get(msg.jobId);
            if (resolver) {
                this.frameResolvers.delete(msg.jobId);
                resolver.resolve();
            }
        } else if (msg.type === 'done') {
            const resolver = this.finishResolvers.get(msg.jobId);
            if (resolver) {
                this.finishResolvers.delete(msg.jobId);
                resolver.resolve(Buffer.from(msg.buffer));
            }
        } else if (msg.type === 'error') {
            this.rejectAllForJob(msg.jobId, new Error(msg.error));
        }
    }
    
    private rejectAllForJob(jobId: number, err: Error) {
        const fr = this.frameResolvers.get(jobId);
        if (fr) {
            this.frameResolvers.delete(jobId);
            fr.reject(err);
        }
        const fir = this.finishResolvers.get(jobId);
        if (fir) {
            this.finishResolvers.delete(jobId);
            fir.reject(err);
        }
        const job = this.activeJobs.get(jobId);
        if (job && job.rejectStart) {
            job.rejectStart(err);
            job.resolveStart = undefined;
            job.rejectStart = undefined;
        }
    }
    
    private handleError(worker: Worker, err: Error) {
        // Find if this worker was active on a job
        for (const [jobId, job] of this.activeJobs.entries()) {
            if (job.worker === worker) {
                this.rejectAllForJob(jobId, err);
                this.activeJobs.delete(jobId);
                break;
            }
        }
        // Remove worker from lists
        this.removeWorker(worker);
        // Respawn to maintain pool size
        this.spawnWorker();
    }
    
    private handleExit(worker: Worker) {
        // Find if this worker was active
        for (const [jobId, job] of this.activeJobs.entries()) {
            if (job.worker === worker) {
                this.rejectAllForJob(jobId, new Error("Worker exited unexpectedly"));
                this.activeJobs.delete(jobId);
                break;
            }
        }
        this.removeWorker(worker);
        this.spawnWorker();
    }
    
    private removeWorker(worker: Worker) {
        const idx = this.workers.indexOf(worker);
        if (idx !== -1) this.workers.splice(idx, 1);
        
        const idleIdx = this.idleWorkers.indexOf(worker);
        if (idleIdx !== -1) this.idleWorkers.splice(idleIdx, 1);
    }
    
    public acquire(width: number, height: number, isFast: boolean): Promise<WorkerSession> {
        return new Promise((resolve, reject) => {
            const totalQueued = this.fastQueue.length + this.fullQueue.length;
            if (totalQueued >= this.maxQueueSize) {
                return reject(new Error("Server busy"));
            }
            
            const req: JobRequest = {
                jobId: nextJobId++,
                width, height, isFast,
                resolveStart: resolve,
                rejectStart: reject
            };
            
            if (isFast) {
                this.fastQueue.push(req);
            } else {
                this.fullQueue.push(req);
            }
            
            this.processNext();
        });
    }
    
    private processNext() {
        if (this.idleWorkers.length === 0) return;
        
        let req = this.fastQueue.shift();
        if (!req) {
            req = this.fullQueue.shift();
        }
        
        if (!req) return; // No jobs pending
        
        const worker = this.idleWorkers.pop()!;
        const session = new WorkerSession(req.jobId, worker, this);
        
        this.activeJobs.set(req.jobId, { worker, session, resolveStart: req.resolveStart, rejectStart: req.rejectStart });
        
        worker.postMessage({ type: 'init', jobId: req.jobId, width: req.width, height: req.height });
    }
    
    public release(session: WorkerSession) {
        const job = this.activeJobs.get(session.jobId);
        if (job) {
            this.activeJobs.delete(session.jobId);
            this.idleWorkers.push(job.worker);
            
            this.frameResolvers.delete(session.jobId);
            this.finishResolvers.delete(session.jobId);
            
            this.processNext();
        }
    }
    
    public registerFrameResolver(jobId: number, resolve: () => void, reject: (err: Error) => void) {
        this.frameResolvers.set(jobId, { resolve, reject });
    }
    
    public registerFinishResolver(jobId: number, resolve: (buf: Buffer) => void, reject: (err: Error) => void) {
        this.finishResolvers.set(jobId, { resolve, reject });
    }
}
