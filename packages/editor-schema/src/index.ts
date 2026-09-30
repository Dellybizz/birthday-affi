export type EditorNodeType = "page" | "section" | "block";

export type EditorNode = {
  id: string;
  type: EditorNodeType | string;
  label?: string;
  parentId: string | null;
  order: number;
  visible: boolean;
  settings: Record<string, unknown>;
  data: Record<string, unknown>;
  responsive?: Record<string, Record<string, unknown>>;
};

export type PageDocument = {
  schemaVersion: number;
  id: string;
  slug: string;
  title: string;
  settings: Record<string, unknown>;
  nodes: EditorNode[];
};
