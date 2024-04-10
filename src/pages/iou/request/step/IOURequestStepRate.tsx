import React from 'react';
import {withOnyx} from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import SelectionList from '@components/SelectionList';
import RadioListItem from '@components/SelectionList/RadioListItem';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as IOU from '@libs/actions/IOU';
import type {MileageRate} from '@libs/DistanceRequestUtils';
import DistanceRequestUtils from '@libs/DistanceRequestUtils';
import Navigation from '@libs/Navigation/Navigation';
import * as TransactionUtils from '@libs/TransactionUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type SCREENS from '@src/SCREENS';
import type {Policy, Transaction} from '@src/types/onyx';
import type {Unit} from '@src/types/onyx/Policy';
import StepScreenWrapper from './StepScreenWrapper';
import withFullTransactionOrNotFound from './withFullTransactionOrNotFound';
import type {WithWritableReportOrNotFoundProps} from './withWritableReportOrNotFound';
import withWritableReportOrNotFound from './withWritableReportOrNotFound';

type IOURequestStepRateOnyxProps = {
    /** Policy details */
    policy: OnyxEntry<Policy>;

    /** Mileage rates */
    rates: Record<string, MileageRate>;
};

type IOURequestStepRateProps = IOURequestStepRateOnyxProps &
    WithWritableReportOrNotFoundProps<typeof SCREENS.MONEY_REQUEST.STEP_RATE> & {
        /** Holds data related to Money Request view state, rather than the underlying Money Request data. */
        transaction: OnyxEntry<Transaction>;
    };

function IOURequestStepRate({
    policy,
    route: {
        params: {action, backTo, transactionID},
    },
    transaction,
    rates,
}: IOURequestStepRateProps) {
    const styles = useThemeStyles();
    const {translate, toLocaleDigit} = useLocalize();
    const isEditing = action === CONST.IOU.ACTION.EDIT;

    const currentRateID = TransactionUtils.getRateID(transaction) ?? '';
    const initiallyFocusedOption = rates[currentRateID]?.name ?? CONST.CUSTOM_UNITS.DEFAULT_RATE;

    const sections = Object.values(rates).map((rate) => ({
        text: rate.name ?? '',
        alternateText: DistanceRequestUtils.getRateForDisplay(true, rate.unit, rate.rate, rate.currency, translate, toLocaleDigit),
        keyForList: rate.name ?? '',
        value: rate.customUnitRateID,
        isSelected: currentRateID ? currentRateID === rate.customUnitRateID : Boolean(rate.name === CONST.CUSTOM_UNITS.DEFAULT_RATE),
    }));

    const unit = (Object.values(rates)[0]?.unit === CONST.CUSTOM_UNITS.DISTANCE_UNIT_MILES ? translate('common.mile') : translate('common.kilometer')) as Unit;

    const navigateBack = () => {
        Navigation.goBack(backTo);
    };

    function selectDistanceRate(customUnitRateID: string) {
        IOU.updateDistanceRequestRate(transactionID, customUnitRateID, policy?.id ?? '', !isEditing);
        navigateBack();
    }

    return (
        <StepScreenWrapper
            headerTitle={translate('common.rate')}
            onBackButtonPress={navigateBack}
            shouldShowWrapper={Boolean(backTo)}
            testID="rate"
        >
            <Text style={[styles.mh5, styles.mv4]}>{translate('iou.chooseARate', {unit})}</Text>

            <SelectionList
                sections={[{data: sections}]}
                ListItem={RadioListItem}
                onSelectRow={({value}) => selectDistanceRate(value ?? '')}
                initiallyFocusedOptionKey={initiallyFocusedOption}
            />
        </StepScreenWrapper>
    );
}

IOURequestStepRate.displayName = 'IOURequestStepRate';

const IOURequestStepRateWithOnyx = withOnyx<IOURequestStepRateProps, IOURequestStepRateOnyxProps>({
    policy: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.POLICY}${report ? report.policyID : '0'}`,
    },
    rates: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.POLICY}${report?.policyID ?? '0'}`,
        selector: DistanceRequestUtils.getMileageRates,
    },
})(IOURequestStepRate);

// eslint-disable-next-line rulesdir/no-negated-variables
const IOURequestStepRateWithWritableReportOrNotFound = withWritableReportOrNotFound(IOURequestStepRateWithOnyx);
// eslint-disable-next-line rulesdir/no-negated-variables
const IOURequestStepRateWithFullTransactionOrNotFound = withFullTransactionOrNotFound(IOURequestStepRateWithWritableReportOrNotFound);

export default IOURequestStepRateWithFullTransactionOrNotFound;
