import React, {useMemo} from 'react';
import {useOnyx} from 'react-native-onyx';
import useDebouncedState from '@hooks/useDebouncedState';
import useLocalize from '@hooks/useLocalize';
import * as OptionsListUtils from '@libs/OptionsListUtils';
import * as Category from '@userActions/Policy/Category'
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import {isEmptyObject} from '@src/types/utils/EmptyObject';
import SelectionList from './SelectionList';
import RadioListItem from './SelectionList/RadioListItem';
import type {ListItem} from './SelectionList/types';

type CategoryPickerProps = {
    policyID: string;
    selectedCategory?: string;
    onSubmit: (item: ListItem) => void;
};

function CategoryPicker({selectedCategory, policyID, onSubmit}: CategoryPickerProps) {
    const [policyCategories] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${policyID}`)
    const [policyCategoriesDraft] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_CATEGORIES_DRAFT}${policyID}`)
    const [policyRecentlyUsedCategories] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY_RECENTLY_USED_CATEGORIES}${policyID}`)

    Category.getPolicyCategories(policyID);

    const {translate} = useLocalize();
    const [searchValue, debouncedSearchValue, setSearchValue] = useDebouncedState('');

    const selectedOptions = useMemo(() => {
        if (!selectedCategory) {
            return [];
        }

        return [
            {
                name: selectedCategory,
                accountID: undefined,
                isSelected: true,
            },
        ];
    }, [selectedCategory]);

    const [sections, headerMessage, shouldShowTextInput] = useMemo(() => {
        const categories = policyCategories ?? policyCategoriesDraft ?? {};
        const validPolicyRecentlyUsedCategories = policyRecentlyUsedCategories?.filter?.((p) => !isEmptyObject(p));
        const {categoryOptions} = OptionsListUtils.getFilteredOptions(
            [],
            [],
            [],
            debouncedSearchValue,
            selectedOptions,
            [],
            false,
            false,
            true,
            categories,
            validPolicyRecentlyUsedCategories,
            false,
        );

        const categoryData = categoryOptions?.[0]?.data ?? [];
        const header = OptionsListUtils.getHeaderMessageForNonUserList(categoryData.length > 0, debouncedSearchValue);
        const categoriesCount = OptionsListUtils.getEnabledCategoriesCount(categories);
        const isCategoriesCountBelowThreshold = categoriesCount < CONST.CATEGORY_LIST_THRESHOLD;
        const showInput = !isCategoriesCountBelowThreshold;

        return [categoryOptions, header, showInput];
    }, [policyRecentlyUsedCategories, debouncedSearchValue, selectedOptions, policyCategories, policyCategoriesDraft]);

    const selectedOptionKey = useMemo(() => (sections?.[0]?.data ?? []).filter((category) => category.searchText === selectedCategory)[0]?.keyForList, [sections, selectedCategory]);

    return (
        <SelectionList
            sections={sections}
            headerMessage={headerMessage}
            textInputValue={searchValue}
            textInputLabel={shouldShowTextInput ? translate('common.search') : undefined}
            onChangeText={setSearchValue}
            onSelectRow={onSubmit}
            ListItem={RadioListItem}
            initiallyFocusedOptionKey={selectedOptionKey ?? undefined}
            isRowMultilineSupported
        />
    );
}

CategoryPicker.displayName = 'CategoryPicker';

export default CategoryPicker;
