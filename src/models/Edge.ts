import { Node } from "./Node";

export interface Edge {
	id: string;
	source: Node;
	target: Node;
	weight?: number;
	directed?: boolean;
}
