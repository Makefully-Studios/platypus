/**
 * Handles resize events.
 */
export default class Resize {
    /**
     * Creates an instance of Resize.
     * @param {function} resizeCallback
     * @memberof Resize
     */
    constructor (resizeCallback, element) {
        const
            onResize = () => {
                let width, height;
        
                if (element) {
                    width = element.clientWidth;
                    height = element.clientHeight;
                } else {
                    width = window.innerWidth;
                    height = window.innerHeight;
                }
        
                if (this.width !== width || this.height !== height) {
                    this.width = width;
                    this.height = height;
                    resizeCallback({
                        width,
                        height
                    });
                }
            };

        this.width = null;
        this.height = null;

        window.addEventListener('resize', onResize);

        if (element) {
            // Check for aspect ratio change every 50 milliseconds.
            this.poll = setInterval(onResize, 50);
        }

        this.destroy = () => {
            window.removeEventListener('resize', onResize);
            if (this.poll) {
                clearInterval(this.poll);
            }
        };
    }
}