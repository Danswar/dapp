import React, { useEffect, useState } from "react";
import AppBox from "@components/AppBox";
import DisplayLabel from "@components/DisplayLabel";
import DisplayAmount from "@components/DisplayAmount";
import { usePoolStats } from "@hooks";
import { formatBigInt, formatDuration, shortenAddress } from "@utils";
import { useAccount, useBlockNumber, useChainId, useReadContract } from "wagmi";
import { readContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { ABIS, ADDRESS } from "@contracts";
import TokenInput from "@components/Input/TokenInput";
import { erc20Abi, formatUnits, zeroAddress } from "viem";
import Button from "@components/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { TxToast, renderErrorToast } from "@components/TxToast";
import { toast } from "react-toastify";
import GuardToAllowedChainBtn from "@components/Guards/GuardToAllowedChainBtn";
import { WAGMI_CONFIG } from "../../app.config";

export default function EquityInteractionWithWFPSRedeem() {
	const [amount, setAmount] = useState(0n);
	const [error, setError] = useState("");
	const [direction, setDirection] = useState(true);
	const [isApproving, setApproving] = useState(false);
	const [isRedeeming, setRedeeming] = useState(false);
	const [wfpsAllowance, setWfpsAllowance] = useState<bigint>(0n);
	const [wfpsBalance, setWfpsBalance] = useState<bigint>(0n);
	const [wfpsHolding, setWfpsHolding] = useState<bigint>(0n);
	const [calculateProceeds, setCalculateProceeds] = useState<bigint>(0n);

	const { data } = useBlockNumber({ watch: true });
	const { address } = useAccount();
	const poolStats = usePoolStats();
	const chainId = useChainId();
	const account = address || zeroAddress;

	useEffect(() => {
		if (account === zeroAddress) return;

		const fetchAsync = async function () {
			const _wfpsAllowance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: erc20Abi,
				functionName: "allowance",
				args: [account, ADDRESS[chainId].wFPS],
			});
			setWfpsAllowance(_wfpsAllowance);

			const _wfpsBalance = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [account],
			});
			setWfpsBalance(_wfpsBalance);

			const _wfpsHolding = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: ABIS.EquityABI,
				functionName: "holdingDuration",
				args: [ADDRESS[chainId].wFPS],
			});
			setWfpsHolding(_wfpsHolding);
		};

		fetchAsync();
	}, [data, account, chainId]);

	useEffect(() => {
		const fetchAsync = async function () {
			const _calculateProceeds = await readContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].equity,
				abi: ABIS.EquityABI,
				functionName: "calculateProceeds",
				args: [amount],
			});
			setCalculateProceeds(_calculateProceeds);
		};

		fetchAsync();
	}, [chainId, amount]);

	const handleApprove = async () => {
		try {
			setApproving(true);

			const approveWriteHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: erc20Abi,
				functionName: "approve",
				args: [ADDRESS[chainId].wFPS, amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " WFPS",
				},
				{
					title: "Spender: ",
					value: shortenAddress(ADDRESS[chainId].wFPS),
				},
				{
					title: "Transaction:",
					hash: approveWriteHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: approveWriteHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Approving WFPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Approved WFPS" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setApproving(false);
		}
	};

	const handleRedeem = async () => {
		try {
			setRedeeming(true);

			const writeHash = await writeContract(WAGMI_CONFIG, {
				address: ADDRESS[chainId].wFPS,
				abi: ABIS.FPSWrapperABI,
				functionName: "unwrapAndSell",
				args: [amount],
			});

			const toastContent = [
				{
					title: "Amount:",
					value: formatBigInt(amount) + " WFPS",
				},
				{
					title: "Receive: ",
					value: formatBigInt(calculateProceeds) + " ZCHF",
				},
				{
					title: "Transaction: ",
					hash: writeHash,
				},
			];

			await toast.promise(waitForTransactionReceipt(WAGMI_CONFIG, { hash: writeHash, confirmations: 1 }), {
				pending: {
					render: <TxToast title={`Unwrap and Redeeming WFPS`} rows={toastContent} />,
				},
				success: {
					render: <TxToast title="Successfully Redeemed WFPS" rows={toastContent} />,
				},
				error: {
					render(error: any) {
						return renderErrorToast(error);
					},
				},
			});
		} finally {
			setRedeeming(false);
		}
	};

	const fromSymbol = "WFPS";
	const toSymbol = "ZCHF";
	const unlocked = wfpsHolding > 86_400 * 90 && wfpsHolding < 86_400 * 365 * 30;

	const onChangeAmount = (value: string) => {
		const valueBigInt = BigInt(value);
		setAmount(valueBigInt);
		if (valueBigInt > wfpsBalance) {
			setError(`Not enough ${fromSymbol} in your wallet.`);
		} else {
			setError("");
		}
	};

	const conversionNote = () => {
		if (amount != 0n && calculateProceeds != 0n) {
			const ratio = (calculateProceeds * BigInt(1e18)) / amount;
			return `1 ${fromSymbol} = ${formatUnits(ratio, 18)} ${toSymbol}`;
		} else {
			return `${toSymbol} price is calculated dynamically.\n`;
		}
	};

	return (
		<>
			<div className="mt-2 px-1">
				You can unwrap and redeem your WFPS tokens, in one step, for ZCHF once the 90-day holding period of the WFPS token contract
				has elapsed.
			</div>
			<div className="mt-8">
				<TokenInput
					max={wfpsBalance}
					symbol={fromSymbol}
					onChange={onChangeAmount}
					value={amount.toString()}
					error={error}
					placeholder={fromSymbol + " Amount"}
				/>
				<div className="py-4 text-center z-0">
					<button
						className={`btn btn-secondary z-0 text-slate-800 w-14 h-14 rounded-full transition ${direction && "rotate-180"}`}
						onClick={() => {}}
					>
						<FontAwesomeIcon icon={faArrowRightArrowLeft} className="rotate-90 w-6 h-6" />
					</button>
				</div>
				<TokenInput symbol={toSymbol} hideMaxLabel output={formatUnits(calculateProceeds, 18)} label="Receive" />
				<div className={`mt-2 px-1 transition-opacity`}>{conversionNote()}</div>

				<div className="mx-auto mt-8 w-72 max-w-full flex-col">
					<GuardToAllowedChainBtn>
						{amount > wfpsAllowance ? (
							<Button isLoading={isApproving} disabled={amount == 0n || !!error || !unlocked} onClick={() => handleApprove()}>
								Approve
							</Button>
						) : (
							<Button
								variant="primary"
								isLoading={isRedeeming}
								disabled={amount == 0n || !!error || !unlocked}
								onClick={() => handleRedeem()}
							>
								Unwrap and Redeem
							</Button>
						)}
					</GuardToAllowedChainBtn>
				</div>
			</div>

			<div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2">
				<AppBox>
					<DisplayLabel label="Your Balance" />
					<DisplayAmount amount={wfpsBalance} currency="WFPS" address={ADDRESS[chainId].wFPS} />
				</AppBox>
				<AppBox>
					<DisplayLabel label="Value at Current Price" />
					<DisplayAmount
						amount={(poolStats.equityPrice * wfpsBalance) / BigInt(1e18)}
						currency="ZCHF"
						address={ADDRESS[chainId].frankenCoin}
					/>
				</AppBox>
				<AppBox>
					<DisplayLabel label="Holding Duration WFPS Contract" />
					<span className={!unlocked ? "text-red-500 font-bold" : ""}>
						{wfpsHolding > 0 && wfpsHolding < 86_400 * 365 * 30 ? formatDuration(wfpsHolding) : "-"}
					</span>
				</AppBox>
				{/* <AppBox className="flex-1">
					<DisplayLabel label="Can redeem after" />
					{formatDuration(redeemLeft)}
				</AppBox> */}
			</div>
		</>
	);
}
