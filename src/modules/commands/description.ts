import { Command } from "@enitoni/gears-discordjs";

import { ParseArgumentsState } from "../../common/parsing/middleware/parseArguments";
import { matchPrefixesStrict } from "../../common/matching/matchPrefixesStrict";

import knex from "../../../db/knex";
import { checkAndInitProfile } from "../../common/knexCommon";

async function insertData(userid: string, description: string) {
    await checkAndInitProfile(userid, description);
    await knex("user")
        .where({ userid })
        .update({ description });
}

export default new Command()
    .match(matchPrefixesStrict("description|desc|about"))
    .use<ParseArgumentsState>(async context => {
        const { message } = context;
        const { args } = context.state;

        try {
            if (args.length) {
                if (args.join(" ").length < 1000) {
                    await insertData(message.author.id, args.join(" "));
                    return message.channel.send(`Done.`);
                } else {
                    return message.channel.send(
                        `**ERROR:** Description is too big.`
                    );
                }
            } else {
                return message.channel.send(
                    `**ERROR:** Please add some text. Try \`cc!help\` for more info.`
                );
            }
        } catch (e) {
            console.info(e);
            return message.channel.send(`**ERROR:** Something went wrong.`);
        }
    });
