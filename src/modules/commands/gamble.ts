import { Command } from "@enitoni/gears-discordjs";

import { ParseArgumentsState } from "../../common/parsing/middleware/parseArguments";
import { matchPrefixesStrict } from "../../common/matching/matchPrefixesStrict";

import knex from "../../../db/knex";

async function checkBalance(amount: number, id: string) {
    if (amount <= 0 || amount >= 1001) {
        return false;
    }

    const balance = (await knex("user").where({ userid: id }))[0].balance;

    return parseInt(balance) >= amount;
}

async function gamble(amount: number) {
    const dice = Math.floor(Math.random() * 100) + 1;
    const win = dice === 100 ? amount * 2 : dice >= 50 ? amount : -amount;

    return { win, dice };
}

async function updateBalance(amount: number, id: string) {
    const { win, dice } = await gamble(amount);

    const balance = (await knex("user").where({ userid: id }))[0].balance;

    await knex("user")
        .where({ userid: id })
        .update({
            balance: win + parseInt(balance)
        });

    const newBalance = win + parseInt(balance);

    return { dice, newBalance };
}

export default new Command()
    .match(matchPrefixesStrict("gamble|dice|slots"))
    .use<ParseArgumentsState>(async context => {
        const { message } = context;
        const { args } = context.state;
        const amount = parseInt(args.join(" "));

        try {
            if (await checkBalance(amount, message.author.id)) {
                const { dice, newBalance } = await updateBalance(
                    amount,
                    message.author.id
                );
                const ending = `** and now you have **$${newBalance}**, <@${message.author.id}>`;
                const winAmount =
                    dice === 100 ? amount * 3 : dice >= 50 ? amount * 2 : 0;
                const response = (() => {
                    if (dice !== 69) {
                        return `🎲 You rolled **${dice}** and **${
                            winAmount === 0
                                ? "lost everything"
                                : `won ${winAmount}`
                        }${ending}`;
                    } else {
                        return `🎲 You rolled **69** (Nice :sunglasses:) and **${"won " +
                            amount * 2}${ending}>`;
                    }
                })();
                return message.channel.send(response);
            } else {
                return message.channel.send("**Wait that's illegal.**");
            }
        } catch (e) {
            console.info(e);
        }
    });
