import { expect, test } from "bun:test";

import { parseCustomersSearchParams } from "./customer-table";

test("missing pagination uses the default page size instead of coercing null to zero", () => {
	expect(parseCustomersSearchParams(new URLSearchParams())).toMatchObject({
		pageIndex: 0,
		pageSize: 10,
	});
	expect(parseCustomersSearchParams(new URLSearchParams("pageSize=500"))).toMatchObject({
		pageSize: 50,
	});
	expect(parseCustomersSearchParams(new URLSearchParams("pageSize=invalid"))).toMatchObject({
		pageSize: 10,
	});
});
