# Firebase Integration

This project uses Firebase for gathering information about performance and crashes.

## Performance Metrics

The following table shows the metrics that are being tracked.

| Metric name | Sent to Firebase | Description | Start time | End time |
|----------|----------|----------|----------|----------|
| `_app_start`   | ✅ | **[ANDROID ONLY]** The time between when the user opens the app and when the app is responsive.     | Starts when the app's `FirebasePerfProvider` `ContentProvider` completes its `onCreate` method.     | Stops when the first activity's `onResume()` method is called.     |
| `js_loaded`    | ✅ | The time it takes for the JavaScript bundle to load. | **Android:** Starts in the `onCreate` method.<br><br>**iOS:** Starts in the AppDelegate's `didFinishLaunchingWithOptions` method.    | Stops at the first render of the app via native module on the JS side.     |
| `_app_in_foreground`    | ✅ | The time when the app is running in the foreground and available to the user.     | **Android:** Starts when the first activity to reach the foreground has its `onResume()` method called. <br><br>**iOS:** Starts when the application receives the `UIApplicationDidBecomeActiveNotification` notification.   | **Android:** Stops when the last activity to leave the foreground has its `onStop()` method called. <br><br>**iOS:** Stops when it receives the `UIApplicationWillResignActiveNotification` notification.     |
| `_app_in_background`    | ✅ | Time when the app is running in the background.     | **Android:** Starts when the last activity to leave the foreground has its `onStop()` method called. <br><br>**iOS:** Starts when the application receives the `UIApplicationWillResignActiveNotification` notification.   | **Android:** Stops when the first activity to reach the foreground has its `onResume()` method called. <br><br>**iOS:** Stops when it receives the `UIApplicationDidBecomeActiveNotification` notification.     |
| `homepage_initial_render`   | ✅ | Time taken for the initial render of the app for a logged in user.     | Starts at the beginning of the initial render of the app.     | Stops at the end of the initial render process.     |
| `sidebar_loaded`    | ❌ | Time taken for the Sidebar to load.     | Starts when the Sidebar is mounted.     | Stops when the Splash Screen is hidden.     |
| `calc_most_recent_last_modified_action`    | ✅ | Time taken to find the most recently modified report action or report.     | Starts when the app reconnects to **the** network     | Ends when the app reconnects to the network and the most recent report action or report is found.     |
| `search_render`   | ✅ | Time taken to render the Chat Finder page.     | Starts when the Chat Finder icon in LHN is pressed.     | Stops when the list of available options is rendered for the first time.     |
| `load_search_options`    | ✅ | Time taken to generate the list of options used in Chat Finder.     | Starts when the `getSearchOptions` function is called.     | Stops when the list of available options is generated.     |
| `search_filter_options`    | ✅ | Time taken to filter search options in Chat Finder by given search value.     | Starts when user types something in the Chat Finder search input.     | Stops when the list of filtered options is generated.     |
| `trie_initialization`   | ✅ | Time taken to build the emoji trie.     | Starts when emoji trie begins to build.     | Stops when emoji trie building is complete.     |
| `open_report`    | ❌ | Time taken to open a report.     | Starts when the row in the `LHNOptionsList` is pressed.     | Stops when the `ReportActionsList` finishes laying out.     |
| `switch_report`    | ✅ | Time taken to open report.     | Starts when the chat in the LHN is pressed.      | Stops when the `ReportActionsList` finishes laying out.     |
| `open_report_from_preview`   | ✅ | Time taken to open a report from preview.<br><br>(previously `switch_report_from_preview`)    | Starts when the user presses the Report Preview.     | Stops when the `ReportActionsList` finishes laying out.     |
| `chat_render`    | ✅ | Time taken to render  the Report screen.     | Starts when the `ReportScreen` is being rendered for the first time.     | Stops once the `ReportScreen` component is mounted.     |
| `report_initial_render`   | ❌ | Time taken to render the Report screen.     | Starts when the first item is rendered in the `LHNOptionsList`.     | Stops when the `ReportActionsList` finishes laying out.     |
| `open_report_thread`   | ✅ | Time taken to open a thread in a report.     | Starts when user presses Report Action Item.     | Stops when the `ReportActionsList` finishes laying out.     |
| `message_sent`    | ❌ | Time taken to send a message.     | Starts when the new message is sent.     | Stops when the message is being rendered in the chat.     |

## Documentation Maintenance:
This documentation must be kept up-to-date as metrics evolve or new features are introduced:
- if new metric is introduced in the codebase, it should be added to the table
- if the name of the marker changed, and the old name is not used anymore, the old name should be marked as removed and point to the new name
- if the marker was removed, it should stay in the table and be marked as removed
- if marker placement has changed in the code its new location should be reflected in the table
- metrics efficiency and correctness should be monitored via analytics tool which uses them (e.g. Firebase)


## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Performance Monitoring](https://firebase.google.com/docs/perf-mon)
- [Firebase Crashlytics](https://firebase.google.com/docs/crashlytics)