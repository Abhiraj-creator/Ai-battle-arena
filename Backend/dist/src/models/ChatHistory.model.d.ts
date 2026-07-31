import mongoose from "mongoose";
import type ChatHistory from "../types/chathistory.types.js";
export declare const ChatHistory: mongoose.Model<ChatHistory, {}, {}, {
    id: string;
}, mongoose.Document<unknown, {}, ChatHistory, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, mongoose.Schema<ChatHistory, mongoose.Model<ChatHistory, any, any, any, any, any, ChatHistory>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
    id: string;
}, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, "id"> & mongoose.HydratedDocumentOverrides<{
    id: string;
}>, {
    userId?: mongoose.SchemaDefinitionProperty<string | undefined, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    battleId?: mongoose.SchemaDefinitionProperty<string, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    turnIndex?: mongoose.SchemaDefinitionProperty<number, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    problem?: mongoose.SchemaDefinitionProperty<string, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    solution_1?: mongoose.SchemaDefinitionProperty<string, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    solution_2?: mongoose.SchemaDefinitionProperty<string, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    judge_provider?: mongoose.SchemaDefinitionProperty<string, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    judge?: mongoose.SchemaDefinitionProperty<{
        solution_1_score: number;
        solution_2_score: number;
        solution_1_reasoning: string;
        solution_2_reasoning: string;
    }, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
    createdAt?: mongoose.SchemaDefinitionProperty<Date | undefined, ChatHistory, mongoose.Document<unknown, {}, ChatHistory, {
        id: string;
    }, mongoose.DefaultSchemaOptions> & Omit<ChatHistory & {
        _id: mongoose.Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & mongoose.HydratedDocumentOverrides<{
        id: string;
    }>>;
}, ChatHistory>, ChatHistory>;
//# sourceMappingURL=ChatHistory.model.d.ts.map