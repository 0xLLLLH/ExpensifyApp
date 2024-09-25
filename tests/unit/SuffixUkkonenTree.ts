import {makeTree} from '@libs/SuffixUkkonenTree';

describe('SuffixUkkonenTree', () => {
    it('should insert, build, and find the word', () => {
        const tree = makeTree([
            {
                data: ['banana'],
                toSearchableString: (data) => data,
            },
        ]);
        tree.build();
        expect(tree.findInSearchTree('an')).toEqual([['banana']]);
    });

    it('should work with multiple words', () => {
        const tree = makeTree([
            {
                data: ['banana', 'test'],
                toSearchableString: (data) => data,
            },
        ]);
        tree.build();

        expect(tree.findInSearchTree('es')).toEqual([['test']]);
    });

    it('should work when providing two data sets', () => {
        const tree = makeTree([
            {
                data: ['erica', 'banana'],
                toSearchableString: (data) => data,
            },
            {
                data: ['banana', 'test'],
                toSearchableString: (data) => data,
            },
        ]);
        tree.build();

        expect(tree.findInSearchTree('es')).toEqual([[], ['test']]);
    });

    it('should work with numbers', () => {
        const tree = makeTree([
            {
                data: [1, 2, 3, 4, 5],
                toSearchableString: (data) => String(data),
            },
        ]);
        tree.build();
        expect(tree.findInSearchTree('2')).toEqual([[2]]);
    });

    it('should work with unicodes', () => {
        const tree = makeTree([
            {
                data: ['banana', 'ñèşťǒř', 'test'],
                toSearchableString: (data) => data,
            },
        ]);
        tree.build();
        expect(tree.findInSearchTree('èşť')).toEqual([['ñèşťǒř']]);
    });

    it('should work with words containing "reserved special characters"', () => {
        // Some special characters are used for the internal representation of the tree
        // However, they are still supported and shouldn't cause any problems.
        // The only gotcha is, that you can't search for special chars (however, none of our searchable data contains any of them).
        const tree = makeTree([
            {
                data: ['ba|nana', 'te{st', 'he}llo'],
                toSearchableString: (data) => data,
            },
        ]);
        tree.build();

        expect(tree.findInSearchTree('st')).toEqual([['te{st']]);
        expect(tree.findInSearchTree('llo')).toEqual([['he}llo']]);
        expect(tree.findInSearchTree('nana')).toEqual([['ba|nana']]);
    });
});
