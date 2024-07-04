import React, {useCallback, useMemo, useState} from 'react';
import {useOnyx} from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import ButtonWithDropdownMenu from '@components/ButtonWithDropdownMenu';
import type {DropdownOption, ReportExportType} from '@components/ButtonWithDropdownMenu/types';
import ConfirmModal from '@components/ConfirmModal';
import useLocalize from '@hooks/useLocalize';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ReportActions from '@libs/actions/Report';
import * as ReportUtils from '@libs/ReportUtils';
import type {ExportType} from '@pages/home/report/ReportDetailsExportPage';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {Report} from '@src/types/onyx';
import type {ConnectionName} from '@src/types/onyx/Policy';

type ExportWithDropdownMenuProps = {
    report: OnyxEntry<Report>;

    connectionName: ConnectionName;
};

function ExportWithDropdownMenu({report, connectionName}: ExportWithDropdownMenuProps) {
    const reportID = report?.reportID;
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const {isSmallScreenWidth} = useResponsiveLayout();
    const [modalStatus, setModalStatus] = useState<ExportType | null>(null);
    const [exportMethods] = useOnyx(ONYXKEYS.LAST_EXPORT_METHOD, {selector: (paymentMethod) => paymentMethod ?? {}});

    const iconToDisplay = ReportUtils.getIntegrationIcon(connectionName);
    const canBeExported = ReportUtils.canBeExported(report);

    const dropdownOptions: Array<DropdownOption<ReportExportType>> = useMemo(() => {
        const optionTemplate = {
            icon: iconToDisplay,
            disabled: !canBeExported,
            displayInDefaultIconColor: true,
        };
        const options = [
            {
                value: CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION,
                text: translate('workspace.common.exportIntegrationSelected', connectionName),
                ...optionTemplate,
            },
            {
                value: CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED,
                text: translate('workspace.common.markAsExported'),
                ...optionTemplate,
            },
        ];
        const exportMethod = exportMethods?.[report?.policyID ?? ''] ?? null;
        if (exportMethod) {
            options.sort((method) => (method.value === exportMethod ? -1 : 0));
        }
        return options;
        // We do not include exportMethods not to re-render the component when the preffered export method changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canBeExported, iconToDisplay, connectionName, report?.policyID, translate]);

    const confirmExport = useCallback(() => {
        setModalStatus(null);
        if (!reportID) {
            return;
        }
        if (modalStatus === CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION) {
            ReportActions.exportToIntegration(reportID, connectionName);
        } else if (modalStatus === CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED) {
            ReportActions.markAsManuallyExported(reportID);
        }
    }, [connectionName, modalStatus, reportID]);

    const savePreferredExportMethod = (value: ReportExportType) => {
        if (!report?.policyID) {
            return;
        }
        ReportActions.savePreferredExportMethod(report?.policyID, value);
    };

    return (
        <>
            <ButtonWithDropdownMenu<ReportExportType>
                success
                pressOnEnter
                shouldAlwaysShowDropdownMenu
                anchorAlignment={{
                    horizontal: CONST.MODAL.ANCHOR_ORIGIN_HORIZONTAL.RIGHT,
                    vertical: CONST.MODAL.ANCHOR_ORIGIN_VERTICAL.TOP,
                }}
                onPress={(_, value) => {
                    if (ReportUtils.isExported(report)) {
                        setModalStatus(value);
                        return;
                    }
                    if (!reportID) {
                        return;
                    }
                    if (value === CONST.REPORT.EXPORT_OPTIONS.EXPORT_TO_INTEGRATION) {
                        ReportActions.exportToIntegration(reportID, connectionName);
                    } else if (value === CONST.REPORT.EXPORT_OPTIONS.MARK_AS_EXPORTED) {
                        ReportActions.markAsManuallyExported(reportID);
                    }
                }}
                onOptionSelected={({value}) => savePreferredExportMethod(value)}
                options={dropdownOptions}
                style={[isSmallScreenWidth && styles.flexGrow1]}
                buttonSize={CONST.DROPDOWN_BUTTON_SIZE.MEDIUM}
            />
            {!!modalStatus && (
                <ConfirmModal
                    title={translate('workspace.exportAgainModal.title')}
                    onConfirm={confirmExport}
                    onCancel={() => setModalStatus(null)}
                    prompt={translate('workspace.exportAgainModal.description', report?.reportName ?? '', connectionName)}
                    confirmText={translate('workspace.exportAgainModal.confirmText')}
                    cancelText={translate('workspace.exportAgainModal.cancelText')}
                    isVisible
                />
            )}
        </>
    );
}

export default ExportWithDropdownMenu;
