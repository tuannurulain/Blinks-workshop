import {
    ACTIONS_CORS_HEADERS,
    ActionGetResponse,
    ActionPostRequest,
    ActionPostResponse,
    MEMO_PROGRAM_ID,
    createPostResponse,
} from "@solana/actions";
import {
    ComputeBudgetProgram,
    Connection,
    PublicKey,
    Transaction,
    TransactionInstruction,
    clusterApiUrl,
} from "@solana/web3.js";

export const GET = (req: Request) => {
    const payload: ActionGetResponse = {
        icon: new URL("/solana_devs.jpg", new URL(req.url).origin).toString(),
        label: "Memo Demo",
        title: "Memo Demo",
        description: "This is a super simple Action",
    };
    return Response.json(payload, {
        headers: ACTIONS_CORS_HEADERS,
    });
};

export const OPTIONS = GET;

export const POST = async (req: Request) => {
    try {
        const body: ActionPostRequest = await req.json();

        if (!body.account) {
            return new Response("Missing 'account' in the request body", {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        let account: PublicKey;
        try {
            account = new PublicKey(body.account);
        } catch (err) {
            return new Response("Invalid 'account' provided", {
                status: 400,
                headers: ACTIONS_CORS_HEADERS,
            });
        }

        const transaction = new Transaction();

        transaction.add(
            ComputeBudgetProgram.setComputeUnitPrice({
                microLamports: 1000,
            }),
            new TransactionInstruction({
                programId: new PublicKey(MEMO_PROGRAM_ID),
                data: Buffer.from("this is a simple memo message", "utf8"),
                keys: [{ pubkey: account, isSigner: true, isWritable: true }],
            })
        );

        transaction.feePayer = account;

        const rpcUrl = process.env.RPC_URL_MAINNET ?? clusterApiUrl("mainnet-beta");
        if (!rpcUrl) {
            return new Response("RPC URL is not configured", { status: 500 });
        }
        const connection = new Connection(rpcUrl);
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

        const payload: ActionPostResponse = await createPostResponse({
            fields: {
                transaction,
            },
        });

        return Response.json(payload, { headers: ACTIONS_CORS_HEADERS });
    } catch (err) {
        console.error(err); // Log the error
        return Response.json("An unknown error occurred", { status: 400 });
    }
};