import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Keyboard, View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import type {Attachment, AttachmentSource} from '@components/Attachments/types';
import BlockingView from '@components/BlockingViews/BlockingView';
import FullScreenLoadingIndicator from '@components/FullscreenLoadingIndicator';
import * as Illustrations from '@components/Icon/Illustrations';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import variables from '@styles/variables';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import CarouselButtons from './CarouselButtons';
import extractAttachments from './extractAttachments';
import type {AttachmentCarouselPagerHandle} from './Pager';
import AttachmentCarouselPager from './Pager';
import type {AttachmentCarouselProps} from './types';
import useCarouselArrows from './useCarouselArrows';

function AttachmentCarousel({report, source, onNavigate, setDownloadButtonVisibility, onClose, type, accountID}: AttachmentCarouselProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const pagerRef = useRef<AttachmentCarouselPagerHandle>(null);
    const [parentReportActions] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report.parentReportID}`, {canEvict: false});
    const [reportActions] = useOnyx(`${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report.reportID}`, {canEvict: false});
    const [page, setPage] = useState<number>();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const {shouldShowArrows, setShouldShowArrows, autoHideArrows, cancelAutoHideArrows} = useCarouselArrows();
    const [activeSource, setActiveSource] = useState<AttachmentSource>(source);
    const [carouselPagerKey, setCarouselPagerKey] = useState(0);
    const compareImage = useCallback((attachment: Attachment) => attachment.source === source, [source]);

    useEffect(() => {
        const parentReportAction = report.parentReportActionID && parentReportActions ? parentReportActions[report.parentReportActionID] : undefined;
        let newAttachments: Attachment[] = [];
        if (type === CONST.ATTACHMENT_TYPE.NOTE && accountID) {
            newAttachments = extractAttachments(CONST.ATTACHMENT_TYPE.NOTE, {privateNotes: report.privateNotes, accountID});
        } else {
            newAttachments = extractAttachments(CONST.ATTACHMENT_TYPE.REPORT, {parentReportAction, reportActions});
        }

        let newIndex = newAttachments.findIndex(compareImage);
        const index = attachments.findIndex(compareImage);

        // If no matching attachment with the same index, dismiss the modal
        if (!newAttachments[newIndex] && newAttachments[index]) {
            newIndex = index;
            // Re-mount the pager to reset the carousel.
            // The newIndex from onPageSelected is inaccurate when attachments change dynamically.
            // Related issue: https://github.com/callstack/react-native-pager-view/issues/597
            setCarouselPagerKey((prevKey) => prevKey + 1);
        }

        if (!newAttachments[newIndex] && attachments[index]) {
            Navigation.dismissModal();
        } else {
            setPage(newIndex);
            setAttachments(newAttachments);

            // Update the download button visibility in the parent modal
            if (setDownloadButtonVisibility) {
                setDownloadButtonVisibility(newIndex !== -1);
            }

            // Update the parent modal's state with the source and name from the mapped attachments
            if (newAttachments[newIndex] !== undefined && onNavigate) {
                onNavigate(newAttachments[newIndex]);
            }
        }
        // eslint-disable-next-line react-compiler/react-compiler, react-hooks/exhaustive-deps
    }, [reportActions, compareImage]);

    /** Updates the page state when the user navigates between attachments */
    const updatePage = useCallback(
        (newPageIndex: number) => {
            Keyboard.dismiss();
            setShouldShowArrows(true);

            const item = attachments[newPageIndex];

            setPage(newPageIndex);
            setActiveSource(item.source);

            if (onNavigate) {
                onNavigate(item);
            }
        },
        [setShouldShowArrows, attachments, onNavigate],
    );

    /**
     * Increments or decrements the index to get another selected item
     * @param {Number} deltaSlide
     */
    const cycleThroughAttachments = useCallback(
        (deltaSlide: number) => {
            if (page === undefined) {
                return;
            }
            const nextPageIndex = page + deltaSlide;
            updatePage(nextPageIndex);
            pagerRef.current?.setPage(nextPageIndex);

            autoHideArrows();
        },
        [autoHideArrows, page, updatePage],
    );

    const containerStyles = [styles.flex1, styles.attachmentCarouselContainer];

    if (page == null) {
        return (
            <View style={containerStyles}>
                <FullScreenLoadingIndicator />
            </View>
        );
    }

    return (
        <View style={containerStyles}>
            {page === -1 ? (
                <BlockingView
                    icon={Illustrations.ToddBehindCloud}
                    iconWidth={variables.modalTopIconWidth}
                    iconHeight={variables.modalTopIconHeight}
                    title={translate('notFound.notHere')}
                />
            ) : (
                <>
                    <CarouselButtons
                        shouldShowArrows={shouldShowArrows}
                        page={page}
                        attachments={attachments}
                        onBack={() => cycleThroughAttachments(-1)}
                        onForward={() => cycleThroughAttachments(1)}
                        autoHideArrow={autoHideArrows}
                        cancelAutoHideArrow={cancelAutoHideArrows}
                    />

                    <AttachmentCarouselPager
                        key={carouselPagerKey}
                        items={attachments}
                        initialPage={page}
                        activeSource={activeSource}
                        setShouldShowArrows={setShouldShowArrows}
                        onPageSelected={({nativeEvent: {position: newPage}}) => updatePage(newPage)}
                        onClose={onClose}
                        ref={pagerRef}
                    />
                </>
            )}
        </View>
    );
}

AttachmentCarousel.displayName = 'AttachmentCarousel';

export default AttachmentCarousel;
