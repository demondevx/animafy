import { parentPort } from 'worker_threads';
import { GifEncoder } from '@napi-rs/canvas';

if (!parentPort) {
    throw new Error('GifWorker must be run as a worker thread');
}

let encoder: GifEncoder | null = null;

parentPort.on('message', (msg) => {
    try {
        if (msg.type === 'init') {
            const { jobId, width, height } = msg;
            encoder = new GifEncoder(width, height, { repeat: 0 });
            parentPort!.postMessage({ type: 'ready', jobId });
        } else if (msg.type === 'addFrame') {
            if (!encoder) throw new Error('Encoder not initialized');
            const { jobId, data, width, height, delay } = msg;
            const uint8Data = new Uint8Array(data);
            encoder.addFrame(uint8Data, width, height, { delay });
            parentPort!.postMessage({ type: 'frameAdded', jobId });
        } else if (msg.type === 'finish') {
            if (!encoder) throw new Error('Encoder not initialized');
            const { jobId } = msg;
            const buffer = encoder.finish();
            encoder = null; // Free up memory for next job
            parentPort!.postMessage({ type: 'done', jobId, buffer });
        }
    } catch (err: any) {
        parentPort!.postMessage({ type: 'error', jobId: msg.jobId, error: err.message });
    }
});
