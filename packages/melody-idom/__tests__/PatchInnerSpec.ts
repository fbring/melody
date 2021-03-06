/**
 * Copyright 2015 The Incremental DOM Authors.
 * Copyright 2017 trivago N.V.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    patch,
    patchInner,
    elementOpen,
    elementOpenStart,
    elementOpenEnd,
    elementClose,
    elementVoid,
    text,
} from '../src';

describe("patching an element's children", () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('with an existing document tree', () => {
        let div;

        function render() {
            elementVoid('div', null, null, 'tabindex', '0');
        }

        beforeEach(function() {
            div = document.createElement('div');
            div.setAttribute('tabindex', '-1');
            container.appendChild(div);
        });

        it('should preserve existing nodes', () => {
            patchInner(container, render);
            const child = container.childNodes[0];

            expect(child).toEqual(div);
        });

        describe('should return DOM node', () => {
            let node;

            it('from elementOpen', () => {
                patchInner(container, () => {
                    node = elementOpen('div');
                    elementClose('div');
                });

                expect(node).toEqual(div);
            });

            it('from elementClose', () => {
                patchInner(container, () => {
                    elementOpen('div');
                    node = elementClose('div');
                });

                expect(node).toEqual(div);
            });

            it('from elementVoid', () => {
                patchInner(container, () => {
                    node = elementVoid('div');
                });

                expect(node).toEqual(div);
            });

            it('from elementOpenEnd', () => {
                patchInner(container, () => {
                    elementOpenStart('div');
                    node = elementOpenEnd('div');
                    elementClose('div');
                });

                expect(node).toEqual(div);
            });

            it('from elementOpen when Node.prototype.contains not available', () => {
                container.contains = undefined;

                patchInner(container, () => {
                    node = elementOpen('div');
                    elementClose('div');
                });

                expect(node).toEqual(div);
            });
        });
    });

    it('should be re-entrant', function() {
        const containerOne = document.createElement('div');
        const containerTwo = document.createElement('div');

        function renderOne() {
            elementOpen('div');
            patchInner(containerTwo, renderTwo);
            text('hello');
            elementClose('div');
        }

        function renderTwo() {
            text('foobar');
        }

        patchInner(containerOne, renderOne);

        expect(containerOne.textContent).toEqual('hello');
        expect(containerTwo.textContent).toEqual('foobar');
    });

    it('should pass third argument to render function', () => {
        function render(content) {
            const el = text(content);
        }

        patchInner(container, render, 'foobar');

        expect(container.textContent).toEqual('foobar');
    });

    it('should patch a detached node', () => {
        const container = document.createElement('div');
        function render() {
            elementVoid('span');
        }

        patchInner(container, render);

        expect(container.firstChild.tagName).toEqual('SPAN');
    });

    it('should throw when an element is unclosed', function() {
        const error = 'One or more tags were not closed:\ndiv';
        expect(() => {
            patch(container, () => {
                elementOpen('div');
            });
        }).toThrowError(error);
    });
});

describe('patching a documentFragment', function() {
    it('should create the required DOM nodes', function() {
        const frag = document.createDocumentFragment();

        patchInner(frag, function() {
            elementOpen('div', null, null, 'id', 'aDiv');
            elementClose('div');
        });

        expect(frag.childNodes[0].id).toEqual('aDiv');
    });
});

describe('when patching an non existing element', function() {
    it('should throw an error', function() {
        const error = 'Patch invoked without an element';
        expect(() =>
            patchInner(null, function() {
                expect(false).toBeTruthy();
            })
        ).toThrowError(error);
    });
});

describe('patch', () => {
    it('should alias patchInner', () => {
        expect(patch).toEqual(patchInner);
    });
});
