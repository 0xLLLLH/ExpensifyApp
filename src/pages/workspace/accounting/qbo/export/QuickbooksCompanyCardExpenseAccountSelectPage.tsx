import React, {useCallback, useMemo} from 'react';
import BlockingView from '@components/BlockingViews/BlockingView';
import * as Illustrations from '@components/Icon/Illustrations';
import RadioListItem from '@components/SelectionList/RadioListItem';
import type {ListItem} from '@components/SelectionList/types';
import SelectionScreen from '@components/SelectionScreen';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as Connections from '@libs/actions/connections';
import * as ConnectionUtils from '@libs/ConnectionUtils';
import Navigation from '@navigation/Navigation';
import type {WithPolicyConnectionsProps} from '@pages/workspace/withPolicyConnections';
import withPolicyConnections from '@pages/workspace/withPolicyConnections';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';
import type {Account} from '@src/types/onyx/Policy';

type CardListItem = ListItem & {
    value: Account;
};

function QuickbooksCompanyCardExpenseAccountSelectPage({policy}: WithPolicyConnectionsProps) {
    const {translate} = useLocalize();
    const styles = useThemeStyles();
    const policyID = policy?.id ?? '-1';
    const {creditCards, accountPayable, bankAccounts} = policy?.connections?.quickbooksOnline?.data ?? {};

    const {nonReimbursableExpensesAccount, nonReimbursableExpensesExportDestination} = policy?.connections?.quickbooksOnline?.config ?? {};

    const data: CardListItem[] = useMemo(() => {
        let accounts: Account[];
        switch (nonReimbursableExpensesExportDestination) {
            case CONST.QUICKBOOKS_NON_REIMBURSABLE_EXPORT_ACCOUNT_TYPE.CREDIT_CARD:
                accounts = creditCards ?? [];
                break;
            case CONST.QUICKBOOKS_NON_REIMBURSABLE_EXPORT_ACCOUNT_TYPE.DEBIT_CARD:
                accounts = bankAccounts ?? [];
                break;
            case CONST.QUICKBOOKS_REIMBURSABLE_ACCOUNT_TYPE.VENDOR_BILL:
                accounts = accountPayable ?? [];
                break;
            default:
                accounts = [];
        }

        return accounts.map((card) => ({
            value: card,
            text: card.name,
            keyForList: card.name,
            isSelected: card.name === nonReimbursableExpensesAccount?.name,
        }));
    }, [nonReimbursableExpensesAccount, creditCards, bankAccounts, nonReimbursableExpensesExportDestination, accountPayable]);

    const selectExportAccount = useCallback(
        (row: CardListItem) => {
            if (row.value.id !== nonReimbursableExpensesAccount?.id) {
                Connections.updatePolicyConnectionConfig(policyID, CONST.POLICY.CONNECTIONS.NAME.QBO, CONST.QUICKBOOKS_CONFIG.NON_REIMBURSABLE_EXPENSES_ACCOUNT, row.value);
            }
            Navigation.goBack(ROUTES.POLICY_ACCOUNTING_QUICKBOOKS_ONLINE_COMPANY_CARD_EXPENSE_ACCOUNT.getRoute(policyID));
        },
        [nonReimbursableExpensesAccount, policyID],
    );

    const listEmptyContent = useMemo(
        () => (
            <BlockingView
                icon={Illustrations.TeleScope}
                iconWidth={variables.emptyListIconWidth}
                iconHeight={variables.emptyListIconHeight}
                title={translate('workspace.qbo.noAccountsFound')}
                subtitle={translate('workspace.qbo.noAccountsFoundDescription')}
                containerStyle={styles.pb10}
            />
        ),
        [translate, styles.pb10],
    );

    return (
        <SelectionScreen
            policyID={policyID}
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN]}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
            displayName={QuickbooksCompanyCardExpenseAccountSelectPage.displayName}
            headerTitleAlreadyTranslated={ConnectionUtils.getQBONonReimbursableExportAccountType(nonReimbursableExpensesExportDestination)}
            headerContent={
                nonReimbursableExpensesExportDestination ? (
                    <Text style={[styles.ph5, styles.pb5]}>{translate(`workspace.qbo.accounts.${nonReimbursableExpensesExportDestination}AccountDescription`)}</Text>
                ) : null
            }
            sections={data.length ? [{data}] : []}
            listItem={RadioListItem}
            onSelectRow={selectExportAccount}
            shouldDebounceRowSelect
            initiallyFocusedOptionKey={data.find((mode) => mode.isSelected)?.keyForList}
            listEmptyContent={listEmptyContent}
            connectionName={CONST.POLICY.CONNECTIONS.NAME.QBO}
            onBackButtonPress={() => Navigation.goBack()}
        />
    );
}

QuickbooksCompanyCardExpenseAccountSelectPage.displayName = 'QuickbooksCompanyCardExpenseAccountSelectPage';

export default withPolicyConnections(QuickbooksCompanyCardExpenseAccountSelectPage);
