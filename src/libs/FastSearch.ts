import CONST from '@src/CONST';
import Timing from './actions/Timing';
import SuffixUkkonenTree from './SuffixUkkonenTree';

type SearchableData<T> = {
    /**
     * The data that should be searchable
     */
    data: T[];
    /**
     * A function that generates a string from a data entry. The string's value is used for searching.
     * If you have multiple fields that should be searchable, simply concat them to the string and return it.
     */
    toSearchableString: (data: T) => string;
};

// There are certain characters appear very often in our search data (email addresses), which we don't need to search for.
const charSetToSkip = new Set(['@', '#', '$', '%', '&', '*', '+', '-', '/', ':', ';', '<', '=', '>', '?', '_', '~', '!']);

/**
 * Creates a new "FastSearch" instance. "FastSearch" uses a suffix tree to search for (sub-)strings in a list of strings.
 * You can provide multiple datasets. The search results will be returned for each dataset.
 *
 * Note: Creating a FastSearch instance with a lot of data is computationally expensive. You should create an instance once and reuse it.
 * Searches will be very fast though, even with a lot of data.
 */
function createFastSearch<T>(dataSets: Array<SearchableData<T>>) {
    // Create a numeric list for the suffix tree, and a look up indexes array
    Timing.start(CONST.TIMING.SEARCH_CONVERT_SEARCH_VALUES);
    const maxNumericListSize = 400_000;
    // The user might provide multiple data sets, but internally, the search values will be stored in this one list:
    let concatenatedNumericList = new Int8Array(maxNumericListSize);
    // Here we store the index of the data item in the original data list, so we can map the found occurrences back to the original data:
    const occurrenceToIndex = new Int32Array(maxNumericListSize * 4);
    // As we are working with ArrayBuffers, we need to keep track of the current offset:
    const offset = {value: 0};
    // We store the last offset for a dataSet, so we can map the found occurrences to the correct dataSet:
    const listOffsets: number[] = [];

    for (const {data, toSearchableString} of dataSets) {
        // Performance critical: the array parameters are out parameters, so we don't want to create new arrays every time:
        dataToNumericRepresentation(concatenatedNumericList, occurrenceToIndex, offset, {data, toSearchableString});
        listOffsets.push(offset.value);
    }
    concatenatedNumericList[offset.value++] = SuffixUkkonenTree.END_CHAR_CODE;
    listOffsets[listOffsets.length - 1] = offset.value;
    Timing.end(CONST.TIMING.SEARCH_CONVERT_SEARCH_VALUES);

    // The list might be larger than necessary, so we clamp it to the actual size:
    concatenatedNumericList = concatenatedNumericList.slice(0, offset.value);

    // Create & build the suffix tree:
    Timing.start(CONST.TIMING.SEARCH_MAKE_TREE);
    const tree = SuffixUkkonenTree.makeTree(concatenatedNumericList);
    Timing.end(CONST.TIMING.SEARCH_MAKE_TREE);

    Timing.start(CONST.TIMING.SEARCH_BUILD_TREE);
    tree.build();
    Timing.end(CONST.TIMING.SEARCH_BUILD_TREE);

    /**
     * Searches for the given input and returns results for each dataset.
     */
    function search(searchInput: string): T[][] {
        const cleanedSearchString = cleanString(searchInput);
        const {numeric} = SuffixUkkonenTree.stringToNumeric(cleanedSearchString, {
            charSetToSkip,
            // stringToNumeric might return a list that is larger than necessary, so we clamp it to the actual size
            // (otherwise the search could fail as we include in our search empty array values):
            clamp: true,
        });
        const result = tree.findSubstring(Array.from(numeric));

        const resultsByDataSet = Array.from({length: dataSets.length}, () => new Set<T>());
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < result.length; i++) {
            const occurrenceIndex = result[i];
            const itemIndexInDataSet = occurrenceToIndex[occurrenceIndex];
            const dataSetIndex = listOffsets.findIndex((listOffset) => occurrenceIndex < listOffset);

            if (dataSetIndex === -1) {
                throw new Error('Programmatic error, this should never ever happen');
            }
            const item = dataSets[dataSetIndex].data[itemIndexInDataSet];
            if (!item) {
                throw new Error('Programmatic error, this should never ever happen');
            }
            resultsByDataSet[dataSetIndex].add(item);
        }

        return resultsByDataSet.map((set) => Array.from(set));
    }

    return {
        search,
    };
}

/**
 * The suffix tree can only store string like values, and internally stores those as numbers.
 * This function converts the user data (which are most likely objects) to a numeric representation.
 * Additionally a list of the original data and their index position in the numeric list is created, which is used to map the found occurrences back to the original data.
 */
function dataToNumericRepresentation<T>(concatenatedNumericList: Int8Array, occurrenceToIndex: Int32Array, offset: {value: number}, {data, toSearchableString}: SearchableData<T>): void {
    // const searchIndexList: Array<T | undefined> = [];

    data.forEach((option, index) => {
        const searchStringForTree = toSearchableString(option);
        const cleanedSearchStringForTree = cleanString(searchStringForTree);

        if (cleanedSearchStringForTree.length === 0) {
            return;
        }

        SuffixUkkonenTree.stringToNumeric(cleanedSearchStringForTree, {
            charSetToSkip,
            out: {
                outArray: concatenatedNumericList,
                offset,
                outOccurrenceToIndex: occurrenceToIndex,
                index,
            },
        });
        // eslint-disable-next-line no-param-reassign
        occurrenceToIndex[offset.value] = index;
        // eslint-disable-next-line no-param-reassign
        concatenatedNumericList[offset.value++] = SuffixUkkonenTree.DELIMITER_CHAR_CODE;
    });
}

/**
 * Everything in the tree is treated as lowercase.
 */
function cleanString(input: string) {
    return input.toLowerCase();
}

const FastSearch = {
    createFastSearch,
};

export default FastSearch;
