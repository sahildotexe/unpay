import { useState, useEffect, useRef } from 'react'
import SocialLogin from '@biconomy/web3-auth'
import { ChainId } from '@biconomy/core-types'
import { ethers } from 'ethers'
import SmartAccount from '@biconomy/smart-account'
import UserTransactions from './UserTransactions'
import { Box, Button, ButtonGroup, Card, CardBody, CardFooter, CardHeader, Center, Flex, Grid, Heading, HStack, IconButton, Img, Link, Menu, MenuButton, MenuItem, MenuList, SimpleGrid, Spacer, Spinner, Stack, StackDivider, Text, VStack } from '@chakra-ui/react'
import { AddIcon, ExternalLinkIcon, HamburgerIcon, RepeatIcon } from '@chakra-ui/icons'
import Image from 'next/image'
import mockup from "../../public/mockup.png"
import piggy from "../../public/cat.jpeg"

export default function Home() {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [interval, enableInterval] = useState(false)
  const sdkRef = useRef<SocialLogin | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [provider, setProvider] = useState<any>(null);
  const biconomyKey: any = process.env.NEXT_PUBLIC_BICONOMY_API
  const whitelist: any = process.env.NEXT_PUBLIC_WHITELIST_URL

  useEffect(() => {
    let configureLogin:any
    if (interval) {
      configureLogin = setInterval(() => {
        if (!!sdkRef.current?.provider) {
          setupSmartAccount()
          clearInterval(configureLogin)
        } 
      }, 1000)
    }

  }, [interval])

  useEffect(() => {
    if (localStorage.getItem('smartAccount')) {
      login()
    }
  }, [])

  async function login() {
    if (!sdkRef.current) {
      const socialLoginSDK = new SocialLogin()
      const signature1 = await socialLoginSDK.whitelistUrl('https://unpay.vercel.app')
      await socialLoginSDK.init({
        chainId: ethers.utils.hexValue(ChainId.POLYGON_MUMBAI),
        whitelistUrls: {
          'https://unpay.vercel.app': signature1,
        }
      })
      sdkRef.current = socialLoginSDK
    }
    if (!sdkRef.current.provider) {
      sdkRef.current.showWallet()
      enableInterval(true)
    } else {
      setupSmartAccount()
    }
  }

  async function setupSmartAccount() {
    if (!sdkRef?.current?.provider) {
      return
    } 
    sdkRef.current.hideWallet()
    setLoading(true)
    const web3Provider = new ethers.providers.Web3Provider(
      sdkRef.current.provider
    )
    setProvider(web3Provider)
    try {
      const smartAccount = new SmartAccount(web3Provider, {
        activeNetworkId: ChainId.POLYGON_MUMBAI,
        supportedNetworksIds: [ChainId.POLYGON_MUMBAI],
        networkConfig: [
          {
            chainId: ChainId.POLYGON_MUMBAI,
            dappAPIKey: biconomyKey,
          },
        ],
      })
      await smartAccount.init()
      setSmartAccount(smartAccount)
      // store account address in local storage
      localStorage.setItem('smartAccount', smartAccount.address )
      setLoading(false)
    } catch (err) {
      console.error(err)   
     }
  }

  const logout = async () => {
    if (!sdkRef.current) {
      console.error('Web3Modal not initialized.')
      return
    }
    await sdkRef.current.logout()
    localStorage.removeItem('smartAccount')
    sdkRef.current.hideWallet()
    setSmartAccount(null)
    enableInterval(false)
  }


  return (
    <div className='main-app'>
      <div className='head'>
      <Flex minWidth='max-content' p='4' alignItems='center' gap='2' display={{ base: 'none', md: 'flex' }}>
  <Box p='2'>
    <Heading size='xl'>Unpay</Heading>
  </Box>
  <Spacer />
   {!smartAccount && !loading && (

  <ButtonGroup gap='2'>
    <Button colorScheme='blue' onClick={login}>sign in</Button>
  </ButtonGroup>

    )} 
    {smartAccount && !loading && (
      <ButtonGroup gap='2'>
        {smartAccount && smartAccount.address && (
  <Box p='2'>
    <Heading size='sm'>signed in as: 
      <Link href={`https://explorer-mumbai.maticvigil.com/address/${smartAccount.address}`} isExternal>
      {
        " " + smartAccount.address.slice(0, 6) + '...' + smartAccount.address.slice(-4)
      }
      </Link>
    </Heading>
  </Box>
  )}
              <Button colorScheme='blue' onClick={logout}>sign out</Button>
      </ButtonGroup>
    )}
    {
      loading && (<Button colorScheme='blue'> 
        <Spinner m='2' />signing in</Button>) 
    }
</Flex>

  {/* for mobile view */}
  <Flex minWidth='max-content' p='4' alignItems='center' gap='2' display={{ base: 'flex', md: 'none' }}>
  <Box p='2'>
    <Heading size='xl'  >Unpay</Heading>
  </Box>
  <Spacer />
  <Menu>
  <MenuButton
    as={IconButton}
    aria-label='Options'
    icon={<HamburgerIcon />}
    variant='outline'
  />
  <MenuList>
    {!smartAccount && !loading && (
      <MenuItem onClick={login}>sign in</MenuItem>
    )}
    {smartAccount && !loading && (
      <MenuItem onClick={logout}>sign out</MenuItem>
    )}
    {
      loading && (<MenuItem>
        <Spinner m='2' />signing in
      </MenuItem>)
    }
  </MenuList>
</Menu>
</Flex>

      </div>
      {
        !smartAccount && !loading && (
            <VStack>
              <Box m='5' >
              <Center>
              <Image src={piggy} alt='logo' height={400} />
              </Center>
              <Center>
              <Heading size='xl' m='8'>buy crypto with spare change</Heading>
              </Center>
              <Center>
                <Text width={{base:"auto",md:"60vw" }} align='justify' fontSize='xl' m='2' my='2' p={{base: '2', md: '6'}} >
                introducing the easiest way to buy your first crypto. Unpay allows you to buy crypto with your spare change.
                </Text>
              </Center>
              </Box>
              <Box minWidth='max-content' m='2' >
                <Button colorScheme='blue' onClick={login}> get started</Button>
              </Box>
             
            </VStack>
        )
      }
      {
        loading && (
          <Box  minHeight='max-content'  className='loading'>
            <Center><Spinner m='2' size='xl' color='blue' /></Center>
            </Box>
        )
      }
      {
        !!smartAccount && (
          <div>
            <UserTransactions smartAccount={smartAccount} provider={provider}  />
          </div>
        )
      }
    </div>
    
  )
}
