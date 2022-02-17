import {useDataFetcher} from './hooks'
import {useUsername, Login, LoginDialog} from './login'
import {getPublicCourses, getStoriesSets} from './api_calls'

let images_lip_colors = {
    "https://stories-cdn.duolingo.com/image/783305780a6dad8e0e4eb34109d948e6a5fc2c35.svg": "d17900",
    "https://stories-cdn.duolingo.com/image/df24f7756b139f6eda927eb776621b9febe1a3f1.svg": "55321f",
    "https://stories-cdn.duolingo.com/image/717bd84875f83c678f64f124937a278061e0e778.svg": "4db000",
    "https://stories-cdn.duolingo.com/image/1b10a427eeaa15c0ed6b690e78cbe8cb1b43e4e3.svg": "eb8bd4",
    "https://stories-cdn.duolingo.com/image/09fc3d3f2b5acf538364fe21f1b5ab3a457b1d7b.svg": "74685e",
    "https://stories-cdn.duolingo.com/image/7e5d271488d31d6f1d0c503512e642ca7effe84f.svg": "4db000",
    "https://stories-cdn.duolingo.com/image/5361833c123aec9adfa60b0dc63398cd1aa49ef2.svg": "b6d0d7",
    "https://stories-cdn.duolingo.com/image/cb76f485e6668f6f964fdf792d3f67ce5ae566b9.svg": "6f4ba2",
    "https://stories-cdn.duolingo.com/image/d52beeb7535f755c3ac9c0475dfc3c87a8f1fa07.svg": "69d6d9",
    "https://stories-cdn.duolingo.com/image/09cbfe4b009b6617a05701652d4210d552d0f5a2.svg": "7f59b8",
    "https://stories-cdn.duolingo.com/image/5dd7c1c9e363ca081026fc76b834b84df03c1ce5.svg": "3b3f42",
    "https://stories-cdn.duolingo.com/image/c705fb9dbd8dd847d687d6e63c7e6eeba2e4d60d.svg": "e5a259",
    "https://stories-cdn.duolingo.com/image/9a2dcd1a9eaff04d1e9b4338e9afcead94c365bf.svg": "f5bbbb",
    "https://stories-cdn.duolingo.com/image/e3c4951a636e72c3f82ef749d5fbf2e61d51628d.svg": "78c800",
    "https://stories-cdn.duolingo.com/image/966f6e25540bc4ba5347e59005bcc1e2827fdd66.svg": "874522",
    "https://stories-cdn.duolingo.com/image/51d1c685bd34b719a260b60637e6774fce1d2cb8.svg": "356a00",
    "https://stories-cdn.duolingo.com/image/5dc22a453cc462fa2ac2412700a39a9e1b47d4e6.svg": "e42222",
    "https://stories-cdn.duolingo.com/image/087b93170babff3e2d63cc840a339f221e6957b0.svg": "3b3f42",
    "https://stories-cdn.duolingo.com/image/d052dcca47838cd5debc241d8963f4a99b3bb873.svg": "58a700",
    "https://stories-cdn.duolingo.com/image/743f08a1a28a5e27e7e78ba3c46443b92365789b.svg": "78c800",
    "https://stories-cdn.duolingo.com/image/f3d07f61cdd95c84cb15d7f9d0e4b0dc8173072b.svg": "f43b3b",
    "https://stories-cdn.duolingo.com/image/9a1213d7cb11cc1ab115544c9557336da748fca6.svg": "6f4ba2",
    "https://stories-cdn.duolingo.com/image/ec74184ed69da39d62ba574fa9d615f7d0c53da1.svg": "bebebe",
    "https://stories-cdn.duolingo.com/image/b4090fb3357cd46aa8eac9f22c4fbbe3265d273e.svg": "1dc0ee",
    "https://stories-cdn.duolingo.com/image/21138fac4fa22d97330dc25cec4b68dcda9abc13.svg": "4b4b4b",
    "https://stories-cdn.duolingo.com/image/82f278cdb107bead5682d9161323e0ba329af607.svg": "4db000",
    "https://stories-cdn.duolingo.com/image/22d80e422eeb2f9e860d1f014edf989ff6257372.svg": "bebebe",
    "https://stories-cdn.duolingo.com/image/af44dc77489e379a0652ce2e7b42bc96e3839833.svg": "eb8bd4",
    "https://stories-cdn.duolingo.com/image/47c4cafa5f4b71f0e3d1cd73377b0324f70da2e6.svg": "419500",
    "https://stories-cdn.duolingo.com/image/c28cb69bf3836fd092352596d98fc29a300c70ce.svg": "d78a20",
    "https://stories-cdn.duolingo.com/image/0641ff57af041e20c48758333ca7a5e76006d438.svg": "0078ce",
    "https://stories-cdn.duolingo.com/image/d009bf5a911fc69baee4534e0bcc9e5478a9b633.svg": "814624",
    "https://stories-cdn.duolingo.com/image/51e004f16574a25cf124ce8d3c718187674dfbdc.svg": "10a3e9",
    "https://stories-cdn.duolingo.com/image/88e500c781ec4505c30a55fa55eda9d2df4a04da.svg": "fe94d5",
    "https://stories-cdn.duolingo.com/image/7118252e70f96bc0ffa531032ec8c2efaf043e7b.svg": "066dcc",
    "https://stories-cdn.duolingo.com/image/1cad8a6eda3c353f9c7c98e338cb8fc3d211644d.svg": "6f4ea1",
    "https://stories-cdn.duolingo.com/image/0abdcc5823240ad538848a828283979a1c445fa9.svg": "33a000",
    "https://stories-cdn.duolingo.com/image/91023e19762be713ac3b9ec727924006b6ca8ce0.svg": "58a700",
    "https://stories-cdn.duolingo.com/image/b9a6aee812d1c55a3facf77e6d552591342f0037.svg": "52ae32",
    "https://stories-cdn.duolingo.com/image/205eb89c151a9cea69e598e00b5cbe534c23881a.svg": "2f2f2f",
    "https://stories-cdn.duolingo.com/image/dc39b146e09be64389b169c261884a6c5ea6fcca.svg": "60dbf8",
    "https://stories-cdn.duolingo.com/image/6830f32cae89c97b8418a589d0539c3d87bbff2b.svg": "1b509f",
    "https://stories-cdn.duolingo.com/image/30aefbeb8dcf34c7a93bff266a4252b79ec143e5.svg": "f5bbbb",
    "https://stories-cdn.duolingo.com/image/c356b975f0ed8c71436b609a97a30491dd71e111.svg": "0078ce",
    "https://stories-cdn.duolingo.com/image/b719cbfd3a627fae092fae93dbf83c8c3cb7fd18.svg": "1cb0f6",
    "https://stories-cdn.duolingo.com/image/02ed13ae1aba57917368af1e2492564588e51b06.svg": "945837",
    "https://stories-cdn.duolingo.com/image/d177f65e767d30af6fc75f7d0fc2c886ce601bea.svg": "6f4ea1",
    "https://stories-cdn.duolingo.com/image/c7b3eabc1e12d46fdff41335bca8b3daa589f0cf.svg": "1cb0f6",
    "https://stories-cdn.duolingo.com/image/9ad6bc610313267c3fbb650a0d94480aa76c8a1c.svg": "0078ce",
    "https://stories-cdn.duolingo.com/image/5c8a64d8aec1682d26f003aafdd4f8fa0abfe4d7.svg": "5a3a8a",
    "https://stories-cdn.duolingo.com/image/7adc3c6ae983a10e3b79bd0efb8bfbb5ed3725c2.svg": "f5a12e",
    "https://stories-cdn.duolingo.com/image/6711cee61441da3d7aa6099466d6fff137239c3a.svg": "78c800",
    "https://stories-cdn.duolingo.com/image/8bc8ee88f110f544dee2d14bdd67af1e645989a9.svg": "9069cd",
    "https://stories-cdn.duolingo.com/image/fd6e3736df0c5ee0ed8b7f0bd6a1e5ca0d4c6859.svg": "eea465",
    "https://stories-cdn.duolingo.com/image/96fd9b652456a41bca2912838b14cb5bd9f7827a.svg": "1899d6",
    "https://stories-cdn.duolingo.com/image/4709ac3b88be5e6b76c502500ea0f593bea8bd14.svg": "a56644",
    "https://stories-cdn.duolingo.com/image/78280e171c39627186afb39898b33c5d1af1e43d.svg": "78c800",
    "https://stories-cdn.duolingo.com/image/d0d5327cf96850b66bb9db4aa71b64a0050a53b3.svg": "2b70c9",
    "https://stories-cdn.duolingo.com/image/170e9caad206d87350e17e32c18226edefea8131.svg": "2b70c9",
    "https://stories-cdn.duolingo.com/image/7cd7723e6a361adbea522f2dc71b13755d4d578c.svg": "c21714",
    "https://stories-cdn.duolingo.com/image/792e2286967c20465f3e45293ca8140533aa119e.svg": "fa6bc2",
    "https://stories-cdn.duolingo.com/image/6d37fa1702d8cb50ebffb3f79fc7c5d020b5459c.svg": "4a8d00",
    "https://stories-cdn.duolingo.com/image/2ccb57023b0ccbeb4541a22890559fbe30b7acc2.svg": "e834a5",
    "https://stories-cdn.duolingo.com/image/d9ab12bffb7890199d0cc6e3961a31c5254cb206.svg": "58a700",
    "https://stories-cdn.duolingo.com/image/be8f47fb647fd1b6b62660bfeceaa284fb800d10.svg": "90d5f1",
    "https://stories-cdn.duolingo.com/image/fea97b34f975e980cb0f47aab08a6980675bbd81.svg": "593d85",
    "https://stories-cdn.duolingo.com/image/1dcd5216b93313f075eb62584804a9bec488724e.svg": "1dc0ee",
    "https://stories-cdn.duolingo.com/image/3b73e46379f8de494377e0f781978308917097da.svg": "fa6bc2",
    "https://stories-cdn.duolingo.com/image/58bb6af97a30f031afaae6f8173bbe9f5f4b96e6.svg": "594184",
    "https://stories-cdn.duolingo.com/image/710f3a5ac270376f08d81bf3208c800c55c9405a.svg": "593d85",
    "https://stories-cdn.duolingo.com/image/120b9964782982500b064c71b098c4b92344be92.svg": "c21714",
    "https://stories-cdn.duolingo.com/image/4a459a2aa33ff61983d53d6cb64e4642869086a2.svg": "ffb100",
    "https://stories-cdn.duolingo.com/image/e70b0075377ea237ac6a6a55eaf12b14491ab78b.svg": "fa6bc2",
    "https://stories-cdn.duolingo.com/image/9835f10a11488cd3b1dcb6ba069f4a738f4f56cd.svg": "ff9600",
    "https://stories-cdn.duolingo.com/image/7d6b3a6c9551eee23b9ef23c77db6da4031295e2.svg": "58a700",
    "https://stories-cdn.duolingo.com/image/b25effb6b84f963315c4cf0b94d70033d61e59cb.svg": "2b70c9",
    "https://stories-cdn.duolingo.com/image/3283c91b393498677a423edd74e33a92764aadca.svg": "4a8d00",
    "https://stories-cdn.duolingo.com/image/f4b7a86b9ce48eb4c9b1538021a584b4449c98a0.svg": "1b5db1",
    "https://stories-cdn.duolingo.com/image/a13fae69b40921c2d4f62a0295a19ff0c25d26eb.svg": "a46647",
    "https://stories-cdn.duolingo.com/image/bec6ac06369ced77777ad5151e3a385213c413b8.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/3b13eb5d447097726c62cdc5f0c59ce615fae365.svg": "cb161b",
    "https://stories-cdn.duolingo.com/image/7a7194e15e27ca4d321f3e215c649415c3084b10.svg": "959595",
    "https://stories-cdn.duolingo.com/image/bc18fe62fb2dd751d977f80742520922d3235edb.svg": "666161",
    "https://stories-cdn.duolingo.com/image/904d8ef9f657f0442c18cd064ed6ae970a7fd252.svg": "61361e",
    "https://stories-cdn.duolingo.com/image/1517cbcf4f4e76f1dc8b0687b90969af2c828c4f.svg": "874e30",
    "https://stories-cdn.duolingo.com/image/b8759b3dd106fcc1ce534a5fa64b7862463c614b.svg": "bdcccf",
    "https://stories-cdn.duolingo.com/image/30fe65475ddc1c2e8d1b6f6c14bd6e43e0180058.svg": "1e153b",
    "https://stories-cdn.duolingo.com/image/9b2262390489b3f5a045dc77896f56f3c20e50f0.svg": "959595",
    "https://stories-cdn.duolingo.com/image/4dfde84d0f5e67f5e356cc4c215701471c811b64.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/3c6df706f419a9e321656b9c4c35f93cd98bb6b1.svg": "e3a15f",
    "https://stories-cdn.duolingo.com/image/7e2fd5d7f620ba85ef1a0bdb114ad83442dabb24.svg": "ff6360",
    "https://stories-cdn.duolingo.com/image/395de5ab9638c37f278413fafb4180244e7bd042.svg": "3e8b0e",
    "https://stories-cdn.duolingo.com/image/983ea34533d3216746f071a9dc5daf00481ceb0b.svg": "b6d0d7",
    "https://stories-cdn.duolingo.com/image/6a073f6357dc14ea58e162202f936682895b11ec.svg": "7ac625",
    "https://stories-cdn.duolingo.com/image/23ec366084ab6a714a7dd9cd9def0e316bbbca06.svg": "4e2989",
    "https://stories-cdn.duolingo.com/image/7ffd75def7116cf2604b92902abfb9f3393dac17.svg": "6b4028",
    "https://stories-cdn.duolingo.com/image/a88dce8c031687c4370e25e71e80b643d0ecf7d2.svg": "169cdd",
    "https://stories-cdn.duolingo.com/image/33ff312288d1c1456f426529bb442fbb37b7fbfb.svg": "61361e",
    "https://stories-cdn.duolingo.com/image/e1d2c08f443668d8f99ef3d26f1d04b70d187ab3.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/09b82c75d938d569334349497ffcbf65775f51ea.svg": "ff85cf",
    "https://stories-cdn.duolingo.com/image/b21485bce15018d0e7423b31c02422f6a9f72195.svg": "595959",
    "https://stories-cdn.duolingo.com/image/4cbc2ae441e2cd2b2696a6ba8f88077b74e06fb3.svg": "f08200",
    "https://stories-cdn.duolingo.com/image/9ca3985bd9c1d1fa5cac10938af9656032cccb46.svg": "61361e",
    "https://stories-cdn.duolingo.com/image/cc35f6155e0dd7e4dea428856763ba0f25e284a9.svg": "baa2a2",
    "https://stories-cdn.duolingo.com/image/7ba92098a48e79462db00f485b5a1b45a1b1e00d.svg": "ffbcbe",
    "https://stories-cdn.duolingo.com/image/9b9061f450b23328702fe3e684904a5641dd5791.svg": "1e153b",
    "https://stories-cdn.duolingo.com/image/16221ba6d2c18d4055e5136c0b32a046b9313cc5.svg": "4b4b4b",
    "https://stories-cdn.duolingo.com/image/1f8f82aab6a16cd4020bcd3c0b48bf98f840996e.svg": "2d2d2d",
    "https://stories-cdn.duolingo.com/image/362617bceae484d99d620d7937a0204699502d4e.svg": "4e7db9",
    "https://stories-cdn.duolingo.com/image/ec03b57e6052db61c39b2e56bad701cc64719e7e.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/24ddf793cf9799aa9125838f9c057496fbcd9d20.svg": "4b4b4b",
    "https://stories-cdn.duolingo.com/image/12d83fa013e64d1f13b97c0a405849ce566a9407.svg": "7f5737",
    "https://stories-cdn.duolingo.com/image/5d3266350bc203b4fcbd02eb6ac0fffc73200303.svg": "8e5435",
    "https://stories-cdn.duolingo.com/image/f701986b4ebe97bfd2df2464ea66f15c035aa0ec.svg": "002c4e",
    "https://stories-cdn.duolingo.com/image/6dc7ee59d104037590efe9b4afe76fbe2d1ba3c6.svg": "b76ce8",
    "https://stories-cdn.duolingo.com/image/62c9d6b47c7d6fdffa33026d75a91bef76403c2d.svg": "4b4b4b",
    "https://stories-cdn.duolingo.com/image/0125bde5027ea20ae06c819388c0a9eab2605828.svg": "a16fd9",
    "https://stories-cdn.duolingo.com/image/423b73ee9e150df75084b5e05f713b34cb1c214a.svg": "1899d6",
    "https://stories-cdn.duolingo.com/image/4381f0cf6dedee84ce24d2c881fcce2f1f909692.svg": "1dc0ee",
    "https://stories-cdn.duolingo.com/image/d719f67944b2e09838cccc11c935d80d3bdfa0bf.svg": "8ad2e3",
    "https://stories-cdn.duolingo.com/image/7b176582983ea6b77cbc245c1a4f9302e3ca8bfb.svg": "69d6d9",
    "https://stories-cdn.duolingo.com/image/5680e1dc10743201b1c4ce2d016223272ae40002.svg": "4b4b4b",
    "https://stories-cdn.duolingo.com/image/b16c72aadc05d26d59a822bcbc53919c17ba53b7.svg": "1dc0ee",
    "https://stories-cdn.duolingo.com/image/ad8c35c2e9c77aaf7d9030a720de3c74d8b8a1a4.svg": "3c3c3c",
    "https://stories-cdn.duolingo.com/image/b867db3552fa0c7849fd6bc55e1203baf0111184.svg": "a56644",
    "https://stories-cdn.duolingo.com/image/596b5452dcd320b0cc7fb468a9dcfb12d9c7972e.svg": "906ec6",
    "https://stories-cdn.duolingo.com/image/db24499e734876b2dc618d1d7dc7a47d6b69dd11.svg": "583d84",
    "https://stories-cdn.duolingo.com/image/1d3e98f9b4bd25d26f035493245af6f085450360.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/981d99d0d2c87d36c69938538f1785da0533492a.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/75e2df33af637e7904f4e40736c32fd141f4fba4.svg": "ff85cf",
    "https://stories-cdn.duolingo.com/image/0e043b3c7d080ff48d886ec6b10279099ef96a17.svg": "f94747",
    "https://stories-cdn.duolingo.com/image/a32dddee7aa42996a7b91d3db47c5e15b81e130b.svg": "8a8a8a",
    "https://stories-cdn.duolingo.com/image/e078a38bd0437918e81c2f07c87a283a14e84c8f.svg": "69d6d9",
    "https://stories-cdn.duolingo.com/image/450592ada18b027200b1004e94fe5ab4a450d03f.svg": "69d6d9",
    "https://stories-cdn.duolingo.com/image/0ad4b3835306aa679c2cff51cbf0515bc09f270f.svg": "98d542",
    "https://stories-cdn.duolingo.com/image/c742be95838ee164da366adbc795e6e08da9c2ee.svg": "61361e",
    "https://stories-cdn.duolingo.com/image/5cbd1c027fc170ebc8c8eff3a397ad22041e72b3.svg": "1e153b",
    "https://stories-cdn.duolingo.com/image/41ee14206f3a427bc6e48c683ea13a94b44659fc.svg": "7f5737",
    "https://stories-cdn.duolingo.com/image/b91b85c726972e04eaf16443cbc1cfef5ec083e9.svg": "4b8e00",
    "https://stories-cdn.duolingo.com/image/5dfc64e2bebf1fac26800f72aa386a85d769a401.svg": "2d2d2d",
    "https://stories-cdn.duolingo.com/image/72a58c6082e9f1475904eed99a94695e54344997.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/80f48a87b3bf20a79fa608a787d302009a90b526.svg": "595959",
    "https://stories-cdn.duolingo.com/image/7760db748143115c4d7e7e9ba63b2ae530c2b552.svg": "5d3d8f",
    "https://stories-cdn.duolingo.com/image/17356bc6f4063356b622797a71685d0397bff19d.svg": "a56644",
    "https://stories-cdn.duolingo.com/image/f01b2bbc722faaf9dfc826d2ec0744138caf8b3a.svg": "988542",
    "https://stories-cdn.duolingo.com/image/84f9a2dd273519e431762584ab025a7ce5401af3.svg": "ea2b2b",
    "https://stories-cdn.duolingo.com/image/686c95bab13b4e85d31b9ed08115b5370f43cd7d.svg": "1dc0ee",
    "https://stories-cdn.duolingo.com/image/c2a92b5fd528afca8fabd43309346c0bba79e72e.svg": "3fd4e0",
    "https://stories-cdn.duolingo.com/image/937c4808cf3264c55ca06398e6690062edeb8cd2.svg": "4b8e00",
    "https://stories-cdn.duolingo.com/image/55e56e802bd98e8d6d8172fe4790d42c1ac40274.svg": "f6cc96",
    "https://stories-cdn.duolingo.com/image/de7da27fccd01c7bd923d99c4886c59f4509ac34.svg": "6f519f",
    "https://stories-cdn.duolingo.com/image/5f098014a8f5b0bc779f02ed1968a8f3ac136b95.svg": "4db000",
    "https://stories-cdn.duolingo.com/image/cf5d6257f8753490966f326d12e23dc506650b19.svg": "4b8e00",
    "https://stories-cdn.duolingo.com/image/1bd0d82eee9df83723328fba49a75e9dcd0a9ae1.svg": "ffb100",
    "https://stories-cdn.duolingo.com/image/437ef6ab2c5bb5186d01fd7ecf10a3b00e9dbc5a.svg": "3e1d70",
    "https://stories-cdn.duolingo.com/image/367ad107602defe9e104ffbaa25a8df8ecadec0b.svg": "2bb1f3",
    "https://stories-cdn.duolingo.com/image/a3f67b92b316b236b2ec283e9da9b93fadd09d13.svg": "583d84",
    "https://stories-cdn.duolingo.com/image/27283d3a28f1f20a2871bf771de8426af2b6ca46.svg": "1899d6",
    "https://stories-cdn.duolingo.com/image/2f7bcb56b8b0c6f7d51db3fca249a0d805aa16f3.svg": "6a3a21",
    "https://stories-cdn.duolingo.com/image/961d5d44d0e1a52236b3a8ac118a7819c74b9f56.svg": "61361e",
    "https://stories-cdn.duolingo.com/image/cacaef9b313efda431889ff53f7d8f4e2ab55c28.svg": "98d542",
    "https://stories-cdn.duolingo.com/image/cbc8bb9092dd2b0ed8513746e3eea4611cab765b.svg": "402211",
    "https://stories-cdn.duolingo.com/image/198c47f1acbb8079a418e86d7f4250d3c8e53f8b.svg": "954d29",
    "https://stories-cdn.duolingo.com/image/1a3ecc7f74993af40b4a5b7d9b4da8d9d45e4a7e.svg": "b5ef8a",
    "https://stories-cdn.duolingo.com/image/9d12163912051f06d8fd030ef1d54930074b8e3d.svg": "98d542",
    "https://stories-cdn.duolingo.com/image/d9b06923d4631ad9ea59fd33d28c08f8c6ecd7cc.svg": "666161",
    "https://stories-cdn.duolingo.com/image/2f5d7c623ff71838607c8b789fc979ba0f0bd045.svg": "3e1d70"
}

export function Spinner(props) {
    return (
        <div id="spinner" style={{position: "relative", width: "100%", height: "200px"}}>
            <div className="spinner_parent">
                <div className="spinner_point point1" />
                <div className="spinner_point point2" />
                <div className="spinner_point point3" />
            </div>
        </div>
    );
}


function LanguageButtonSmall(props) {
    /**
     * A button in the language drop down menu (flag + name)
     */
    let course = props.course;

    let language = props.language_data[course.learningLanguage];
    return <a
        className="language_select_item"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
        style={{display: "block"}}
    >
        <Flag language_data={props.language_data}  lang={course.learningLanguage}/>
        <span>{course.name || language.name}</span>
    </a>;
}
function LanguageSelector(props) {
    const courses = useDataFetcher(getPublicCourses, []);

    if(courses === undefined || props.language_data === undefined)
        return <div id="header_lang_selector" />
    return (
        <div id="header_lang_selector">
            {courses.map(course => (
                <LanguageButtonSmall language_data={props.language_data} key={course.id} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
            ))}
        </div>
    );
}

/*
* LanguageSelectorBig
* */

function LanguageSelectorBig(props) {
    const courses = useDataFetcher(getPublicCourses, []);

    if(courses === undefined || props.language_data === undefined)
        return <Spinner />
    return (
        <div id="list">
            <div className="set_list">
                {courses.map(course => (
                    <LanguageButton key={course.id} language_data={props.language_data} course={course} onClick={(e) => {e.preventDefault(); props.languageClicked(course.learningLanguage, course.fromLanguage)}} />
                ))}
            </div>
        </div>
    );
}

function LanguageButton(props) {
    let course = props.course;
    let language = props.language_data[course.learningLanguage];
    return <a
        className="language_select_button"
        onClick={props.onClick}
        href={`index.html?lang=${course.learningLanguage}&lang_base=${course.fromLanguage}`}
    >
        <Flag language_data={props.language_data} className="flag_big" lang={course.learningLanguage}/>

        <span className="language_select_button_text">{course.name || language.name}</span>
    </a>;
}

export function Flag(props) {
    /**
     * A big flag button
     * @type {{flag_file: string, flag: number}}
     */
    let language = {flag: 0, flag_file: ""};
    if(props.language_data && props.lang)
        language = props.language_data[props.lang];
    return <div className={"flag "+props.className}
                style={language.flag_file ? {backgroundImage: `url(flags/${language.flag_file})`} : {backgroundPosition: `0 ${language.flag}px`}}
    />
}

/* ******** */

function SetList(props) {
    const sets = useDataFetcher(getStoriesSets, [props.lang, props.lang_base, props.username]);

    if(sets === undefined)
        return <Spinner />;

    return <div id="list">
        {sets.map(stories => (
            <div key={stories[0].set_id} className="set_list">
                <div className="set">Set {stories[0].set_id}</div>
                {stories.map(story => (
                    <StoryButton key={story.id} story={story} onStoryClicked={props.onStoryClicked}  />
                ))}
            </div>
        ))}
    </div>
}

function StoryButton(props) {
    let story = props.story;
    return <a
        className="story_link"
        onClick={(e) => {e.preventDefault(); props.onStoryClicked(story.id); }}
        href={`story.html?story=${story.id}`}
    >
        <button
            className="button_story2"
            data-done={story.time != null}
            style={story.time === null ? {borderColor: "#"+images_lip_colors[story.image]} : {}}
        >
            <img src={story.time != null ? story.image_done : story.image} alt="story"/>
        </button>
        <div
            className="story_title2"
        >{story.name_base}</div>
    </a>;
}


export function IndexContent(props) {
    let lang = props.course[0];
    let lang_base = props.course[1];
    let [username, doLogin, doLogout, showLogin, setShowLogin] = useUsername();

    function languageClicked(lang, lang_base) {
        props.setCourse([lang, lang_base])
    }

    if(showLogin !== 0)
        return <LoginDialog useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />

    return <div>
        <div id="header_index">
            <div id="header_language" style={{display: "block", float:"left"}}>
                <Flag language_data={props.language_data} lang={lang}/>
                <LanguageSelector language_data={props.language_data} languageClicked={languageClicked} />
            </div>
            <Login useUsername={[username, doLogin, doLogout, showLogin, setShowLogin]} />
        </div>
        <div id="main_index">
            <h1>Unofficial Duolingo Stories</h1>
            <p style={{textAlign: "center"}}>This page is a community project to bring the original <a
                href="https://www.duolingo.com/stories">Duolingo Stories</a> to new languages.
                <br/>As the Duolingo Forum is shutting down, you can now meet us on Discord <a href="https://discord.gg/4NGVScARR3">join</a>.
                <br/>
                The old forum discussion is currently still available <a href="https://forum.duolingo.com/comment/38992372">here</a>.</p>
            <br/>
            {lang !== undefined ?
                <SetList lang={lang} lang_base={lang_base} username={username} onStoryClicked={(id)=>props.onStartStory(id)}/> :
                <LanguageSelectorBig language_data={props.language_data} languageClicked={languageClicked}/>
            }

            <hr/>

            <div style={{textAlign: "center", color:"gray", fontSize: "0.8em"}}>
                These stories are owned by Duolingo, Inc. and are used under license from Duolingo.<br/>
                Duolingo is not responsible for the translation of these stories <span
                id="license_language">{props.language_data && props.language_data[lang] ? "into "+props.language_data[lang].name : ""}</span> and this is not an official product of Duolingo.
                Any further use of these stories requires a license from Duolingo.<br/>
                Visit <a style={{color:"gray"}} href="https://www.duolingo.com">www.duolingo.com</a> for more
                information.
            </div>

        </div>
    </div>
}

