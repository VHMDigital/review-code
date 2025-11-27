export interface PropertiesCollection {
    count: number;
    value: Record<string, PropertyValue>;
}

export interface PropertyValue {
    $type: string;
    $value: string;
};