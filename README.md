
# Tholian® Vulnerabilities Database

The Tholian® Vulnerabilities Database is an attempt to unify downstream security tracker
data with the upstream CVE database entries for the intent of automating security audits.

The purpose of this database is to provide a merged dataset that can be used in a fully
automated manner in order to audit the security and potential attack surface of a system.


# Make CVE Great Again

The CVE database itself is heavily broken, never updated and basically useless as a
dataset due to not conforming to any of their own schemas and not even having affected
software fields other than "n/a" or other manually entered text descriptions.


# Quickstart

The [updater/updater.mjs](./updater/updater.mjs) imports all upstream CVE entries, and
then incrementally updates all entries by scraping the downstream security trackers.

All [vulnerabilities](/vulnerabilities) have a separate Boolean `_is_edited` property
which reflects whether or not the entry was edited with the Web Editor. These entries
are skipped during the update process, assuming that a manually edited entry is more
up-to-date than the ones in the (semi-)automated security trackers.

```bash
# Update all security tracker data
node updater/updater.mjs update;

# Merge all locally cached security tracker data
node updater/updater.mjs merge;
```


# Web Editor

The Web Editor is a tool that allows to quickly search and modify entries in batches,
so that broken CVE entries can be corrected in a time efficient manner.

```bash
# Start the Web Editor on Port 8080
node ./editor/serve.mjs;

# Open Web Editor in Browser
gio open http://localhost:8080/
```


# License

The license is the same as upstream. As `MITRE` grants all rights irrevocably for the `CVEList Downloads`
in their [ToS page](https://cve.mitre.org/about/termsofuse.html), I'm hereby using the next best
equivalent that is legally possible.

Code modifications and implementations done by the contributors of this repository are licensed
under the `MIT/Expat license`. Dataset changes and fixes that were merged with the CVE database
are licensed under the Creative Commons `CC0` license.

