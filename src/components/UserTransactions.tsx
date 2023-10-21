import React, { useState, useEffect } from "react";
import SmartAccount from "@biconomy/smart-account";
import abi from "../utils/contractAbi.json";
import { ethers } from "ethers";
import Transak from "@biconomy/transak";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Center,
  defineStyle,
  defineStyleConfig,
  Heading,
  HStack,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spinner,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Tfoot,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { OnrampWebSDK } from "@onramp.money/onramp-web-sdk";
import axios from "axios";

interface Props {
  smartAccount: SmartAccount;
  provider: any;
}

const UserTransactions: React.FC<Props> = ({ smartAccount, provider }) => {
  const [count, setCount] = useState<number>(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen:isWidgetOpen, onOpen:onWidgetOpen, onClose:onWidgetClose } = useDisclosure();

  const [counterContract, setCounterContract] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [spareData, setSpareData] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [file, setFile] = useState<any | null>(null);
  const [allUserTransactions, setAllUserTransactions] = useState<any[]>([]);
  const toast = useToast();
  const [spareAmount, setSpareAmount] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [chat, setChat] = useState<string>("");
  const [price,setPrice] = useState<string>("")
 const [isPriceLoading,setIsPriceLoading] = useState<boolean>(false)
  const counterAddress: any = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  useEffect(() => {
    setIsLoading(true);
    getData();
  }, []);

  const getData = async () => {
    const contract = new ethers.Contract(counterAddress, abi, provider);
    setCounterContract(contract);
    const transactionCount = await contract.getTransactionCount(
      smartAccount.address
    );
    const fetchedSpareData = await contract.getSpareData(smartAccount.address);
    setSpareData(fetchedSpareData);
    setSpareAmount(fetchedSpareData[0] / 100);
    setCount(transactionCount.toNumber());
    const fetchedTransactions = await contract.getAllTransactions(
      smartAccount.address
    );
    // loop through fetchedTransactions and add roundUp to each transaction upto 2 decimal places
    const transactionsWithRoundUp = fetchedTransactions.map(
      (transaction: any) => {
        const roundUp =
          (transaction.amount / 100) % 10 === 0
            ? 0
            : (10 - ((transaction.amount / 100) % 10)).toFixed(2);
        return {
          ...transaction,
          roundUp,
        };
      }
    );
    setAllUserTransactions(transactionsWithRoundUp);

    setIsLoading(false);
  };

  const handleInvest = async () => {
    // const transak = new Transak("STAGING", {
    //   walletAddress: smartAccount.address,
    //   network: "polygon",
    //   fiatAmount: 500,
    //   fiatCurrency: "INR",
    //   defaultCryptoCurrency: "USDT",
    // });
    // transak.init();
    if (spareAmount < 101) {
      toast({
        description: "spare amount should be greater than 100",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    const onrampInstance = new OnrampWebSDK({
      appId: 2, // replace this with the appID you got during onboarding process
      walletAddress: smartAccount.address, // replace with user's wallet address
      flowType: 1, // 1 -> onramp || 2 -> offramp || 3 -> Merchant checkout
      fiatType: 1, // 1 -> INR || 2 -> TRY || 3 -> AED || 4 -> MXN || 5-> VND || 6 -> NGN
      paymentMethod: 1, // 1 -> Instant transafer(UPI) || 2 -> Bank transfer(IMPS/FAST)
      fiatAmount: spareAmount, // replace with the amount you want to buy
    });

    onrampInstance.show();

    onrampInstance.on("TRANSACTION_SUCCESSFUL", async (data) => {
      console.log("transaction successful", data);
      // updateSpareData
      try {
        const addDocTx =
          await counterContract.populateTransaction.updateSpareData(
            smartAccount.address,
            0,
            spareAmount
          );
        const tx1 = {
          to: counterAddress,
          data: addDocTx.data,
        };
        const txResponse = await smartAccount.sendTransaction({
          transaction: tx1,
        });
        const txHash = await txResponse.wait();
        toast({
          title: "thanks for waiting...",
          description: "paying gas fees on your behalf!!",
          status: "info",
          duration: 9000,
          isClosable: true,
        });

        await getData();
        toast({
          title: "transaction successful",
          status: "success",
          duration: 9000,
          isClosable: true,
        });
      } catch (error) {
        console.log({ error });
      }
    });
  };

  const handleUpload = async () => {
    const parsedAmount = amount * 100;
    const today = new Date();
    const date = today.toLocaleDateString();
    const time = today.toLocaleTimeString();
    const dateTime = date + " " + time;
    const roundUp =
      (parsedAmount / 100) % 10 === 0
        ? 0
        : parseFloat((10 - ((parsedAmount / 100) % 10)).toFixed(2));
    console.log("roundUp: ", roundUp);
    const parsedRoundUp = roundUp * 100;
    setIsUploading(true);
    if (!title) {
      toast({
        title: "no title given",
        description: "please give a title",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setIsUploading(false);
      return;
    }
    if (!amount) {
      toast({
        title: "no amaount entered",
        description: "please enter a valid amount",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      setIsUploading(false);
      return;
    }

    try {
      const addDocTx =
        await counterContract.populateTransaction.uploadTransaction(
          title,
          parsedAmount,
          dateTime,
          parsedRoundUp
        );
      const tx1 = {
        to: counterAddress,
        data: addDocTx.data,
      };
      const txResponse = await smartAccount.sendTransaction({
        transaction: tx1,
      });
      const txHash = await txResponse.wait();
      toast({
        title: "thanks for waiting...",
        description: "paying gas fees on your behalf!!",
        status: "info",
        duration: 9000,
        isClosable: true,
      });

      await getData();
      setIsUploading(false);
      toast({
        title: "transaction uploaded!",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      setAmount(0);
      setTitle("");
      onClose();
    } catch (error) {
      setIsUploading(false);
      console.log({ error });
    }
  };

  const onSendChat = async () => {
    // https://api.0x.org/swap/v1/price?sellToken=ETH&buyToken=DAI&sellAmount=5
    if(chat=="") {
      toast({
        title: "no query given",
        description: "please enter a valid query",
        status: "error",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
    const sentenceArray=chat.split(" ")
    var sellToken=sentenceArray[8]
    var buyToken=sentenceArray[2]
    const sellAmount=sentenceArray[7]
    setIsPriceLoading(true)
    // axios get request with api key as header
    try{
      const response = await axios.get(`https://api.0x.org/swap/v1/price?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${sellAmount}`,{
        headers: {
          "Content-Type": "application/json",
          "0x-api-key": process.env.NEXT_PUBLIC_0X_API_KEY,
        }
      })
        
    setPrice(response.data.buyAmount)
    setIsPriceLoading(false)

    } catch(error) {
      console.log({error})
      setIsPriceLoading(false)

    }

  };


  return (
    <>
      <div>
        <Center>
          <Button onClick={onOpen} colorScheme="blue" m="8" mx="0">
            {" "}
            + add new transaction
          </Button>
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader> add new transaction: </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Text>title: </Text>
                <Input
                  type="text"
                  p="3"
                  m="4"
                  mx="0"
                  name="title"
                  id="title"
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Text>amount(in INR): </Text>
                <NumberInput
                  defaultValue={0}
                  onChange={(valueString) => setAmount(parseFloat(valueString))}
                  precision={2}
                  step={0.2}
                >
                  <NumberInputField />
                </NumberInput>
              </ModalBody>

              <ModalFooter>
                <Button colorScheme="blue" onClick={handleUpload}>
                  {isUploading ? <Spinner m="2" /> : ""}
                  confirm
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          <Modal isOpen={isWidgetOpen} onClose={onWidgetClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalCloseButton />
              <ModalBody>
              <VStack>
                    {/* <iframe
                      id="widget__iframe"
                      height="610px"
                      width="420px"
                      src="https://app.thevoyager.io/swap?isWidget=true&widgetId=widget-0101&fromChain=56&toChain=137&fromToken=0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56&toToken=0x16ECCfDbb4eE1A85A33f3A9B21175Cd7Ae753dB4"
                    ></iframe> */}
                    <Box>
                    <Text fontSize="md">get best price for swap</Text>

                    </Box>
                    <Box>
                    <Textarea onChange={(e)=>setChat(e.target.value)} placeholder="enter your query here" />

                    </Box>
                    <Box>
                    <Button onClick={onSendChat} colorScheme="blue" m="4">
                      {
                        isPriceLoading ? <Spinner m="2" /> : ""
                      }
                      send
                    </Button>

                    </Box>
                    {
                      price && (
                        <Box>
                        <Text fontSize="md">amount: {price}</Text>
                        </Box>
                      )
                    }
                  </VStack>
              </ModalBody>
            </ModalContent>
          </Modal>
        </Center>
        <Box p="4">
          {!isLoading ? (
            <Box>
              <Center>
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Title</Th>
                        <Th isNumeric>Amount</Th>
                        <Th>Timestamp</Th>
                        <Th>Round up</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {allUserTransactions.map((transaction, index) => {
                        return (
                          <Tr key={index}>
                            <Td>{transaction.title}</Td>
                            <Td isNumeric>
                              {parseFloat(transaction.amount) / 100}
                            </Td>
                            <Td>{transaction.date}</Td>
                            <Td style={{ color: "green" }}>
                              {" "}
                              + {transaction.roundUp}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Center>
              {spareAmount > 0 ? (
                <>
                  <Center p="4">
                    <Heading size="md">
                      total uninvested spare amount: {spareAmount}
                    </Heading>
                  </Center>
                  <Center>
                    <Button onClick={handleInvest} colorScheme="blue" m="4">
                      invest spare amount
                    </Button>
                    <Button onClick={onWidgetOpen} colorScheme="blue" m="4">
                      get quotations to swap
                    </Button>
                  </Center>
                </>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </div>
    </>
  );
};

export default UserTransactions;
