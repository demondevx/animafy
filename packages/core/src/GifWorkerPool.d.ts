import { Worker } from 'worker_threads';
export interface GifWorkerPoolOptions {
    size: number;
}
export declare class WorkerSession {
    readonly jobId: number;
    private readonly worker;
    private readonly pool;
    constructor(jobId: number, worker: Worker, pool: GifWorkerPool);
    addFrame(data: ArrayBuffer, width: number, height: number, delayMs: number): Promise<void>;
    finish(): Promise<Buffer>;
}
export declare class GifWorkerPool {
    private readonly workers;
    private readonly idleWorkers;
    private readonly fastQueue;
    private readonly fullQueue;
    private readonly activeJobs;
    private readonly frameResolvers;
    private readonly finishResolvers;
    private readonly maxQueueSize;
    private readonly workerPath;
    constructor(options: GifWorkerPoolOptions);
    private spawnWorker;
    private handleMessage;
    private rejectAllForJob;
    private handleError;
    private handleExit;
    private removeWorker;
    acquire(width: number, height: number, isFast: boolean): Promise<WorkerSession>;
    private processNext;
    release(session: WorkerSession): void;
    registerFrameResolver(jobId: number, resolve: () => void, reject: (err: Error) => void): void;
    registerFinishResolver(jobId: number, resolve: (buf: Buffer) => void, reject: (err: Error) => void): void;
}
