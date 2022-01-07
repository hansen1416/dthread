export const RPC_URL = "http://127.0.0.1:8899";

export const GROUPS_PROGRAM_ID = "FULzW9g9a9xGLEwFiVDPRD4gmGS53m8uMCTX7beqhCnB";

// same as rust struct
export class DataAccount {
	id: string = "";
	constructor(fields: { id: string } | undefined = undefined) {
		if (fields) {
			this.id = fields.id;
		}
	}
}

/**
 * Borsh schema definition for greeting accounts
 */
export const DataSchema = new Map([
	[DataAccount, { kind: "struct", fields: [["id", "String"]] }],
]);
