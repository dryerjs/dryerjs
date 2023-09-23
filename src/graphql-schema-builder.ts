import * as graphql from 'graphql';
import { AnyClass, ModelDefinition } from './type';

export class GraphqlTypeBuilder {
    static build(modelDefinition: ModelDefinition) {
        return {
            output: this.getOutputType(modelDefinition),
            create: this.getCreateInputType(modelDefinition),
            update: this.getUpdateInputType(modelDefinition),
        };
    }

    private static traverse(
        modelDefinition: ModelDefinition,
        fn: (property: string, typeInClass: AnyClass) => void,
    ) {
        const instance = new modelDefinition();
        for (const propertyName in instance) {
            const typeInClass = instance[propertyName];
            fn(propertyName, typeInClass);
        }
    }

    private static getOutputType(modelDefinition: ModelDefinition) {
        const result = {
            name: modelDefinition.name,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLObjectType(result);
    }

    private static getCreateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Create${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            if (propertyName === 'id') return;
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLInputObjectType(result);
    }

    private static getUpdateInputType(modelDefinition: ModelDefinition) {
        const result = {
            name: `Update${modelDefinition.name}Input`,
            fields: {},
        };

        this.traverse(modelDefinition, (propertyName, typeInClass) => {
            if (propertyName === 'id') return;
            const typeConfig = {
                String: graphql.GraphQLString,
                Date: graphql.GraphQLString,
                Number: graphql.GraphQLInt,
            };
            result.fields[propertyName] = { type: typeConfig[typeInClass.name] };
        });

        return new graphql.GraphQLInputObjectType(result);
    }
}
