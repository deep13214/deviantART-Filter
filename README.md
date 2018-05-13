## Overview
**Have you ever want to block/filter deviations (a.k.a. submissions) while browsing [DeviantArt](https://www.deviantart.com)? Well now you can!**

Simply install DeviantArt Filter in your web browser of choice and filter deviations by user, tag, and/or category from the configuration screen.

![DeviantArt Filter Promotional Image](./screenshots/Promo.png)

* * *

## Installation
| Web Browser | Information | Download Link |
| ----------- | ----------- | ------------- |
| Google Chrome | [![Chrome Web Store][chrome-image-version]][chrome-url]<br/>[![Chrome Web Store][chrome-image-download]][chrome-url] | [Download from the Chrome Web Store][chrome-url] |
| Mozilla Firefox | [![Mozilla Add-on][firefox-image-version]][firefox-url]<br/>[![Mozilla Add-on][firefox-image-download]][firefox-url] | [Download from Mozilla Add-ons][firefox-url] |

* * *

## Usage

### Opening the Management Panel/Screen
1. While on [DeviantArt](https://www.deviantart.com), click the red logo that appears on the right side of the address bar:
![DeviantArt Filter Page Action Demo](./screenshots/Page-Action-Demo.png)
2. The configuration screen will open automatically when you click the icon.

### Creating and Removing Filters
#### You can filter deviations by artist, category, and/or tag through the management panel/screen.
1. After [opening the Management Panel/Screen](#opening-the-management-panelscreen), navigate to any of the Manage [Users](#manage-users-page)/[Tags](#manage-tags-page)/[Categories](#manage-categories-page) tabs.
2. To create a new filter, use the form at the top of the tab.
    - For users, enter their username.
    - For tags, enter a single tag (*no spaces*), then choose if the tag should use wildcard matching.
    - For categories, select the parent category, then (optionally) select sub-categories.
3. Use the table that is displayed below the form to view all of your existing filters.
    - You can sort the table by clicking the heading of any column.
    - You can page through your filters using the pagination controls in the lower-left corner.
    - You can choose how many filters are displayed per page using the controls in the lower-right corner.
4. To remove a filter, click the `Remove Filter` button next to the filter you want to remove.

### Exporting/Importing Filters
DeviantArt Filter allows you to export and import filters from a JSON file. This is mostly for keeping your filters in sync between browsers/computers, but is handy for backup purposes as well.
1. After [opening the Management Panel/Screen](#opening-the-management-panelscreen), navigate to the [Import/Export Filters](#importexport-filters-page) tab.
2. To export your current filters to a JSON file, click the `Export Filter Data` button, then open/save the file when prompted (it will use your browser's native download functionality).
3. To import filters from a JSON file, either drag and drop the file onto the designated box, or click the box to open a File Browser dialog and select your JSON file.
    - After the import has finished, a table showing the results of the import will be displayed. This includes how many filters were imported successfully, as well as how many filters failed to import (either because they were invalid or were duplicate).

### Quick Hiding Users While Browsing
1. While browsing on [DeviantArt](https://www.deviantart.com), when you see a deviation from a user you wish to filter, hover over the thumbnail image.
2. An `x` icon will appear in the top-left corner of the thumbnail.
3. Click on the `x` to filter that user.

* * *

## Options
Options for DeviantArt filtered are configured through the [Management Panel/Screen](#opening-the-management-panelscreen) on the [Options](#options-page) tab.

### Use Placeholders for Filtered Deviations
`When enabled, a placeholder image is displayed instead of the actual thumbnail for filtered deviations. Disable this setting to completely remove filtered deviation thumbnails.`

If you want to see/know when a deviation was filtered (and why), enable this option (it is enabled by default). This will show a placeholder instead of the deviation's thumbnail (similar to Mature Content that is blocked). If you would rather just completely hide deviations matching any of your filters, disable this option, and the thumbnails will be removed entirely.

### Management Panel Type
`Specifies where/how the main management panel is displayed when clicking the DeviantArt Filter logo by the address bar.`

This option allows you to control if the DeviantArt Filter Management page is opened in a new tab in your current browser window, or if a new popup window is opened. The default behavior for this option is to use a new tab in the current window.

### Number of Days to Cache Metadata
`Specifies the number of days to cache metadata (for tags and categories) locally for deviations. Set this value to disable local caching completely.`

By default, DeviantArt Filter caches the metadata for deviations while browsing [DeviantArt](https://www.deviantart.com) on your computer. This is done so that your category and tag filters can be applied more quickly on subsequent visits, as retrieving metadata for each page of deviations takes 2-5 seconds on an average internet connection. You can disable the local cache completely by setting this option to `0`, but this will cause a noticeable delay before tag and category filters are applied. You can also increase this setting, although setting a value that is too large may cause performance issues.

### Show Metadata Debug Indicators
`When enabled, deviation thumbnails with missing metadata (for tags and categories) have a red outline, and deviations with metadata have a green outline. This is primarily for debugging, but can be a neat visual for curious people.`

This setting, as the description states, is primarily for troubleshooting and debugging. It is used simply to show which deviations have loaded metadata (i.e. their tags and which category they are in). Because metadata has to be fetched from DeviantArt's API, your tag and category filters cannot be applied until that metadata is loaded. The outlines (green for loaded, red for NOT loaded), can help you see why your filters may not seem to be working.

## Screenshots

### Options Page
![Screenshot of the DeviantArt Filter Options Page](./screenshots/Options.png)

### Manage Users Page
![Screenshot of the DeviantArt Filter Manage Users Page](./screenshots/Users.png)

### Manage Tags Page
![Screenshot of the DeviantArt Filter Manage Tags Page](./screenshots/Tags.png)

### Manage Categories Page
![Screenshot of the DeviantArt Filter Manage Categories Page](./screenshots/Categories.png)

### Import/Export Filters Page
![Screenshot of the DeviantArt Filter Import/Export Page](./screenshots/Import-Export.png)

### Browse Page with Placeholders Enabled
![Screenshot of DeviantArt with placeholders enabled for filtered deviations](./screenshots/Placeholders.png)

### Browse Page with Placeholders Disabled
![Screenshot of DeviantArt with placeholders disabled for filtered deviations](./screenshots/No-Placeholders.png)


[chrome-url]: https://chrome.google.com/webstore/detail/deviantart-filter/odlmamilbohnpnoomjclomghphbajikp
[chrome-image-download]: https://img.shields.io/chrome-web-store/d/odlmamilbohnpnoomjclomghphbajikp.svg
[chrome-image-version]: https://img.shields.io/chrome-web-store/v/odlmamilbohnpnoomjclomghphbajikp.svg
[firefox-url]: https://addons.mozilla.org/en-US/firefox/addon/deviantart-filter/
[firefox-image-download]: https://img.shields.io/amo/d/deviantart-filter.svg
[firefox-image-version]: https://img.shields.io/amo/v/deviantart-filter.svg
