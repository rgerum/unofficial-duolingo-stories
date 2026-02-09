import { authComponent } from "./betterAuth/auth";
import {query} from "./_generated/server";

export const { getAuthUser } = authComponent.clientApi();

export const getCurrentUser = query({
    args: {},
    handler: async (ctx, args) => {
          const identity = await ctx.auth.getUserIdentity();
          if(identity) {
              if(identity.role == undefined) {
                  identity.role = "user";
              }
          }
          return identity;
    },
})