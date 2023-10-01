import { Model } from './model';
import { CreateApi, DeleteApi, GetApi, PaginateApi, UpdateApi, GetAllApi } from './apis';

export class ApiBuilder {
    public static build<T>(model: Model<T>) {
        const queryFields = {
            ...new GetApi(model).getEndpoint(),
            ...new PaginateApi(model).getEndpoint(),
            ...new GetAllApi(model).getEndpoint(),
        };
        const mutationFields = {
            ...new CreateApi(model).getEndpoint(),
            ...new UpdateApi(model).getEndpoint(),
            ...new DeleteApi(model).getEndpoint(),
        };
        return {
            queryFields,
            mutationFields,
        };
    }
}
