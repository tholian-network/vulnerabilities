
# Trackers

- [x] CVE List
- [ ] NVD Database
- [x] CISA Known Exploited Vulnerabilities
- [ ] GitHub Advisories (GHSA)
- [ ] GitLab Advisories (GLAD)


# Platform-specific Trackers

- [ ] Alma Linux
- [ ] Alpine Linux
- [ ] Amazon Linux
- [x] Arch Linux
- [ ] CentOS Stream
- [x] Debian Linux
- [ ] PhotonOS
- [ ] Ubuntu Linux
- [ ] Microsoft (MSRC)

- [ ] Redhat Enterprise Linux

  Documentation at `https://access.redhat.com/documentation/en-us/red_hat_security_data_api/1.0/html-single/red_hat_security_data_api/index`
  API at `https://access.redhat.com/hydra/rest/securitydata/cvrf.json?per_page=100000&after=2000-01-01&before=2000-12-31`
  CVE API at `https://access.redhat.com/hydra/rest/securitydata/cve/<CVE-ID>.json`


## Updater Incomplete

- [ ] Implement `Vulnerabilities.prototype.disconnect()` method to persist entries.
- [ ] Implement `Vulnerabilities.prototype.update()` method to store modified entries.
- [ ] Implement XML Support in `Webscraper` to be able to download odata-based tracker data directly via their schemas (Thanks, Microsoft and SAP!).

**Editor**:

- [ ] Frontend: Implement the Save Functionality using `fetch()` and `POST`.
- [ ] Backend: Implement `POST /vulnerabilities/CVE-YYYY-NNNNN.json` and update `/api/editor/index.json` (from previous state to `edited`).

