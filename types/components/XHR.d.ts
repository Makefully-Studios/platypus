import type { ComponentContribution } from '../entity-of';

/**
 * Contribution for XHR.
 * props/methods mirror publicProperties/publicMethods; events are static listeners/fires from the component definition.
 */
export interface XHRContribution extends ComponentContribution {
    props: {
        // none
    };
    methods: {
        // none
    };
    events: {
    "request": unknown;
    };
    componentProps: {
    method?: unknown;
    path?: unknown;
    responseType?: unknown;
    withCredentials?: unknown;
    };
}

export type XHRProps = XHRContribution['props'];
export type XHREvents = XHRContribution['events'];
