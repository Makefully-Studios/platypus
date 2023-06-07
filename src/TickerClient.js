export default class {
    constructor (targetFPS = 60) {
        const
            listeners = this.listeners = [],
            worker = this.worker = new Worker(new URL('./TickerServer.js', import.meta.url));

        this.deltaMS = 1000 / targetFPS;
        this.elapsedMS = this.deltaMS;
        
        worker.onmessage = ({data}) => {
            this.elapsedMS = data.elapsedMS;
            listeners.forEach((listener) => listener(data.elapsedMS));
        };

        this.start();
    }

    add (listener) {
        this.listeners.push(listener);
    }

    remove (listener) {
        const
            i = this.listeners.indexOf(listener);

        if (i >= 0) {
            this.listeners.splice(i, 1);
        }
    }

    start () {
        this.worker.postMessage({
            begin: {
                delta: this.deltaMS
            }
        });
    }

    stop () {
        this.worker.postMessage({
            stop: true
        });
    }

    get FPS () {
        return 1000 / this.elapsedMS;
    }
}
