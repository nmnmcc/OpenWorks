export type GroupSubjects = {
	readonly Group: {
		readonly id: string;
		readonly slug: string;
	};
	readonly Role: {
		readonly id: string;
		readonly groupId: string;
	};
	readonly Permission: {
		readonly id: string;
	};
	readonly GroupMember: {
		readonly id: string;
		readonly groupId: string;
		readonly userId: string;
		readonly roleId: string;
	};
	readonly GroupInvitation: {
		readonly id: string;
		readonly groupId: string;
		readonly email: string;
		readonly roleId: string;
		readonly invitedById: string;
		readonly status: string;
	};
};
