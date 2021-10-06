export interface TokenizationService {
    createItem(item_id: number): void;
    updateItem(item_id: number): void;
    assignItem(item_id: number, instance_number: number, user_id: string): void;
    updateItemInstance(
        item_id: number,
        instance_number: number,
        data: Record<string, string>
    ): void;
    transferItemInstance(
        item_id: number,
        instance_number: number,
        to_user_id: string
    ): void;
}
