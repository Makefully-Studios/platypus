self.onmessage = ({data}) => {
    let interval = 0;

    if (data.begin) {
        let time = performance.now();

        clearInterval(interval);
        interval = setInterval(() => {
            const
                newTime = performance.now();

            self.postMessage({
                elapsedMS: newTime - time
            });

            time = newTime;
        }, data.begin.delta);
    }
    if (data.stop) {
        clearInterval(interval);
    }
};

