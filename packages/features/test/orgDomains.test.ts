import { describe, expect, it } from "vitest";

import { orgDomainConfig, getOrgSlug } from "@calcom/features/ee/organizations/lib/orgDomains";
import * as constants from "@calcom/lib/constants";

function setupEnvs({ WEBAPP_URL = "https://mygpt.fi" } = {}) {
  Object.defineProperty(constants, "WEBAPP_URL", { value: WEBAPP_URL });
  Object.defineProperty(constants, "ALLOWED_HOSTNAMES", {
    value: ["mygpt.fi", "cal.dev", "cal-staging.com", "mygpt.fi.community", "cal.local:3000", "localhost:3000"],
  });
  Object.defineProperty(constants, "RESERVED_SUBDOMAINS", {
    value: ["app", "auth", "docs", "design", "console", "go", "status", "api", "saml", "www", "matrix", "developer", "cal", "my", "team", "support", "security", "blog", "learn", "admin"],
  });
}

describe("Org Domains Utils", () => {
  describe("orgDomainConfig", () => {
    it("should return a valid org domain", () => {
      setupEnvs();
      expect(orgDomainConfig("acme.mygpt.fi")).toEqual({
        currentOrgDomain: "acme",
        isValidOrgDomain: true,
      });
    });

    it("should return a non valid org domain", () => {
      setupEnvs();
      expect(orgDomainConfig("app.mygpt.fi")).toEqual({
        currentOrgDomain: "app",
        isValidOrgDomain: false,
      });
    });

    it("should return a non valid org domain for localhost", () => {
      setupEnvs();
      expect(orgDomainConfig("localhost:3000")).toEqual({
        currentOrgDomain: null,
        isValidOrgDomain: false,
      });
    });
  });

  describe("getOrgSlug", () => {
    it("should handle a prod web app url with a prod subdomain hostname", () => {
      setupEnvs();
      expect(getOrgSlug("acme.mygpt.fi")).toEqual("acme");
    });

    it("should handle a prod web app url with a staging subdomain hostname", () => {
      setupEnvs();
      expect(getOrgSlug("acme.cal.dev")).toEqual(null);
    });

    it("should handle a local web app with port url with a local subdomain hostname", () => {
      setupEnvs({ WEBAPP_URL: "http://app.cal.local:3000" });
      expect(getOrgSlug("acme.cal.local:3000")).toEqual("acme");
    });

    it("should handle a local web app with port url with a non-local subdomain hostname", () => {
      setupEnvs({ WEBAPP_URL: "http://app.cal.local:3000" });
      expect(getOrgSlug("acme.mygpt.fi:3000")).toEqual(null);
    });
  });
});
