export type DrawOperation = 
    | DrawAvatarOperation
    | DrawTextOperation
    | DrawImageOperation
    | DrawRectOperation;

export interface BaseOperation {
    type: string;
}

export interface DrawAvatarOperation extends BaseOperation {
    type: 'avatar';
    url: string;
    x: number;
    y: number;
    radius: number;
}

export interface DrawTextOperation extends BaseOperation {
    type: 'text';
    text: string;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
}

export interface DrawImageOperation extends BaseOperation {
    type: 'image';
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DrawRectOperation extends BaseOperation {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    radius?: number;
}
