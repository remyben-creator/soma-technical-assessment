export type Todo = {
  id: number;
  title: string;
  createdAt: Date | string;
  dueDate?: Date | string | null;
  imageURL?: string | null;
};

export type Dependency = {
  fromId: number;
  toId: number;
};