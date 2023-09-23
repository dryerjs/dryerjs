import mongoose from 'mongoose';
import { MongooseSchemaBuilder } from './mongoose-schema-builder';

interface DryerConfig {
    models: any[],
    beforeApplicationInit?: Function,
    afterApplicationInit?: Function,
    mongoUri: string;
}

export class Dryer {
    private constructor(private config: DryerConfig) {}

    static init(config: DryerConfig) {
        return new Dryer(config);
    }

    public async start() {
        this.config?.beforeApplicationInit();

        for (const model of this.config.models) {
            const mongooseSchema = MongooseSchemaBuilder.build(model) as any;
            mongoose.model(model.name, mongooseSchema);
        }
        await mongoose.connect(this.config.mongoUri);
        this.config?.afterApplicationInit();
    }
}
