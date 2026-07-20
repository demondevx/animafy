export type DrawOperation =
    | DrawAvatarOperation
    | DrawTextOperation
    | DrawImageOperation
    | DrawRectOperation
    | DrawGradientOperation
    | DrawCircleOperation
    | DrawLineOperation
    | DrawProgressBarOperation
    | PushStateOperation
    | PopStateOperation
    | SetFilterOperation
    | SetShadowOperation
    | SetOpacityOperation
    | ClearFilterOperation
    | ClearShadowOperation;

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
    maxWidth?: number;
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

export interface GradientStop {
    offset: number;
    color: string;
}

export interface DrawGradientOperation extends BaseOperation {
    type: 'gradient';
    gradientType: 'linear' | 'radial';
    x: number;
    y: number;
    width: number;
    height: number;
    stops: GradientStop[];
    /** For linear: angle in degrees (0 = left-to-right). For radial: ignored. */
    angle?: number;
    radius?: number;
}

export interface DrawCircleOperation extends BaseOperation {
    type: 'circle';
    x: number;
    y: number;
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
}

export interface DrawLineOperation extends BaseOperation {
    type: 'line';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
    lineWidth: number;
}

export interface DrawProgressBarOperation extends BaseOperation {
    type: 'progressBar';
    x: number;
    y: number;
    width: number;
    height: number;
    progress: number;
    barColor: string;
    bgColor: string;
    radius?: number;
}

export interface PushStateOperation extends BaseOperation {
    type: 'pushState';
}

export interface PopStateOperation extends BaseOperation {
    type: 'popState';
}

export interface SetFilterOperation extends BaseOperation {
    type: 'filter';
    filter: string;
}

export interface SetShadowOperation extends BaseOperation {
    type: 'shadow';
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
}

export interface SetOpacityOperation extends BaseOperation {
    type: 'opacity';
    value: number;
}

export interface ClearFilterOperation extends BaseOperation {
    type: 'clearFilter';
}

export interface ClearShadowOperation extends BaseOperation {
    type: 'clearShadow';
}
