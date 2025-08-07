/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-e7681877'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "android/android-launchericon-144-144.png",
    "revision": "137faa2a0f7dbc8117511eb7c2e2e534"
  }, {
    "url": "android/android-launchericon-192-192.png",
    "revision": "2675ed4d695f203ff0d3f93d183ecb3c"
  }, {
    "url": "android/android-launchericon-48-48.png",
    "revision": "224503e0fb8d9745178cdafd21a3d40a"
  }, {
    "url": "android/android-launchericon-512-512.png",
    "revision": "73a2bd1d15c5050cc7e393b13c03ef52"
  }, {
    "url": "android/android-launchericon-72-72.png",
    "revision": "227a2d612ba5cdc9f971d1ab577db4d0"
  }, {
    "url": "android/android-launchericon-96-96.png",
    "revision": "2c6f3cdd5d43e053f3ce9ca275d1de4f"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a4e79da125ea1a9ca166bf34d3bdbeff"
  }, {
    "url": "assets/browser-BJzWpxwN.js",
    "revision": null
  }, {
    "url": "assets/building-C9gHlg1G.js",
    "revision": null
  }, {
    "url": "assets/calendar-C74xrtK-.js",
    "revision": null
  }, {
    "url": "assets/charts-BJm2rqVP.js",
    "revision": null
  }, {
    "url": "assets/Checkbox-BpHhfu3x.js",
    "revision": null
  }, {
    "url": "assets/circle-check-big-DVnhIFCM.js",
    "revision": null
  }, {
    "url": "assets/circle-x-DlQCBl1I.js",
    "revision": null
  }, {
    "url": "assets/createLucideIcon-DASLDl8g.js",
    "revision": null
  }, {
    "url": "assets/CreateWorkOrderPage-5L31TkkH.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-Bl9fqDMS.js",
    "revision": null
  }, {
    "url": "assets/EditWorkOrderPage-CI5jPKfV.js",
    "revision": null
  }, {
    "url": "assets/EquipmentDetailPage-DUA5c2xu.js",
    "revision": null
  }, {
    "url": "assets/EquipmentPage-Bt9EBkAF.js",
    "revision": null
  }, {
    "url": "assets/equipmentService-CGlfRJkk.js",
    "revision": null
  }, {
    "url": "assets/forms-DMy9WhkY.js",
    "revision": null
  }, {
    "url": "assets/index-Btxjy4e4.js",
    "revision": null
  }, {
    "url": "assets/index-PSsCOTBe.css",
    "revision": null
  }, {
    "url": "assets/Input-OlwPPxfv.js",
    "revision": null
  }, {
    "url": "assets/InventoryPage-B43fWlri.js",
    "revision": null
  }, {
    "url": "assets/LoginMFA-Dpain5-Z.js",
    "revision": null
  }, {
    "url": "assets/map-pin-CdV6g3Wc.js",
    "revision": null
  }, {
    "url": "assets/Modal-4x9NRLcF.js",
    "revision": null
  }, {
    "url": "assets/NotFound-DOCZdOME.js",
    "revision": null
  }, {
    "url": "assets/Pagination-DdLUPgBg.js",
    "revision": null
  }, {
    "url": "assets/PartDetailPage-BMEYdZhi.js",
    "revision": null
  }, {
    "url": "assets/PreventiveMaintenancePage-CUAz3vJc.js",
    "revision": null
  }, {
    "url": "assets/Profile-DL_98K7H.js",
    "revision": null
  }, {
    "url": "assets/query-CLuFM9qe.js",
    "revision": null
  }, {
    "url": "assets/ReportsPage-DtLfaOtT.js",
    "revision": null
  }, {
    "url": "assets/router-CIxT34gc.js",
    "revision": null
  }, {
    "url": "assets/Select-CKM8koO3.js",
    "revision": null
  }, {
    "url": "assets/settings-DTJb2Tov.js",
    "revision": null
  }, {
    "url": "assets/SettingsPage-D1oKLTEE.js",
    "revision": null
  }, {
    "url": "assets/supabase-sunz-wJP.js",
    "revision": null
  }, {
    "url": "assets/ui-4GILbMi1.js",
    "revision": null
  }, {
    "url": "assets/useEquipmentSelection-Cjj_3lpE.js",
    "revision": null
  }, {
    "url": "assets/user-DJ8yG-Z0.js",
    "revision": null
  }, {
    "url": "assets/useWorkOrders-Cyn9AYGR.js",
    "revision": null
  }, {
    "url": "assets/utils-B0gfkMDq.js",
    "revision": null
  }, {
    "url": "assets/vendor-oxSIIS9b.js",
    "revision": null
  }, {
    "url": "assets/VendorsPage-BOA_iKSV.js",
    "revision": null
  }, {
    "url": "assets/WorkOrderChecklistPage-BRRIakhK.js",
    "revision": null
  }, {
    "url": "assets/WorkOrderDetailPage-DyIybyxY.js",
    "revision": null
  }, {
    "url": "assets/WorkOrderForm-ZuTOkSEt.js",
    "revision": null
  }, {
    "url": "assets/WorkOrderHistoryPage-DrStnI-9.js",
    "revision": null
  }, {
    "url": "assets/WorkOrdersPage-BzK5KFsk.js",
    "revision": null
  }, {
    "url": "assets/zod-B6aXCBp6.js",
    "revision": null
  }, {
    "url": "index.html",
    "revision": "33fa50166313aa1523570c4fa4b4c406"
  }, {
    "url": "ios/100.png",
    "revision": "a3a17d03242cf57d040e87faefc441d1"
  }, {
    "url": "ios/1024.png",
    "revision": "3951938fbb7afcedb57c66af453637fd"
  }, {
    "url": "ios/114.png",
    "revision": "593640281a755a83b3b0abbee8608678"
  }, {
    "url": "ios/120.png",
    "revision": "c89d429504f79bee0ce23fc50c7f677d"
  }, {
    "url": "ios/128.png",
    "revision": "274ccb6e20ff3149f60e2a51cd8fd1a1"
  }, {
    "url": "ios/144.png",
    "revision": "137faa2a0f7dbc8117511eb7c2e2e534"
  }, {
    "url": "ios/152.png",
    "revision": "7f8ffd42add6ded9b61312a7be0a4ddf"
  }, {
    "url": "ios/16.png",
    "revision": "8892f214e04cb936f70ab87a9bdc7026"
  }, {
    "url": "ios/167.png",
    "revision": "80afccaab1a81b10796b5488c49965b7"
  }, {
    "url": "ios/180.png",
    "revision": "a4e79da125ea1a9ca166bf34d3bdbeff"
  }, {
    "url": "ios/192.png",
    "revision": "2675ed4d695f203ff0d3f93d183ecb3c"
  }, {
    "url": "ios/20.png",
    "revision": "2f85318bf101d0b3459a7b248d303238"
  }, {
    "url": "ios/256.png",
    "revision": "99b5928aa74e906a14e6cef8432ffd2e"
  }, {
    "url": "ios/29.png",
    "revision": "e07b34b79b117ebf6d0061bf89c42266"
  }, {
    "url": "ios/32.png",
    "revision": "23a3e87b39bee8f3908c21936cd8c421"
  }, {
    "url": "ios/40.png",
    "revision": "9ddfc58f2852d56dd97c9303eab9e896"
  }, {
    "url": "ios/50.png",
    "revision": "181243962ecdc6774675488033a517b1"
  }, {
    "url": "ios/512.png",
    "revision": "73a2bd1d15c5050cc7e393b13c03ef52"
  }, {
    "url": "ios/57.png",
    "revision": "4c4b43bdad46e72e2662e602a7a6fa43"
  }, {
    "url": "ios/58.png",
    "revision": "a52ff984a3045999647fffc138e413f8"
  }, {
    "url": "ios/60.png",
    "revision": "5ac32e58fce94350d6c1f222bacd0bd5"
  }, {
    "url": "ios/64.png",
    "revision": "dd051e5725a7d12d2633afc52401e36f"
  }, {
    "url": "ios/72.png",
    "revision": "227a2d612ba5cdc9f971d1ab577db4d0"
  }, {
    "url": "ios/76.png",
    "revision": "064eadcce1138006bb6cd457f791965e"
  }, {
    "url": "ios/80.png",
    "revision": "a0744f3c8e457157906b8a0d3a51c4e8"
  }, {
    "url": "ios/87.png",
    "revision": "9d8f154f558f143ff2a1a50aabad54c4"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2675ed4d695f203ff0d3f93d183ecb3c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "73a2bd1d15c5050cc7e393b13c03ef52"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "windows11/LargeTile.scale-100.png",
    "revision": "1a50624232c60e11e04fa27760dc5f60"
  }, {
    "url": "windows11/LargeTile.scale-125.png",
    "revision": "00423d661e1953752a2ae24d66a65021"
  }, {
    "url": "windows11/LargeTile.scale-150.png",
    "revision": "8ce882af702751d16ee77ce78774dc83"
  }, {
    "url": "windows11/LargeTile.scale-200.png",
    "revision": "6222292ebe413e84995bd1dc800ed907"
  }, {
    "url": "windows11/LargeTile.scale-400.png",
    "revision": "d9b7677ab93d1097aa84fb29261a18a1"
  }, {
    "url": "windows11/SmallTile.scale-100.png",
    "revision": "7be7c54d7155551e089487480995fce0"
  }, {
    "url": "windows11/SmallTile.scale-125.png",
    "revision": "3df81d8a4ce4dfe55f925e8e64769029"
  }, {
    "url": "windows11/SmallTile.scale-150.png",
    "revision": "b4e7e893caa5140da134a49c1dff1627"
  }, {
    "url": "windows11/SmallTile.scale-200.png",
    "revision": "6eff13ff7d7890aafd328ef66efe8e90"
  }, {
    "url": "windows11/SmallTile.scale-400.png",
    "revision": "7efbb4e5c7848dfd8e1dbfe15e45ee3d"
  }, {
    "url": "windows11/SplashScreen.scale-100.png",
    "revision": "f37ed1262d0a6cda0e7329cb433bddaf"
  }, {
    "url": "windows11/SplashScreen.scale-125.png",
    "revision": "9b72a58657fc3018420fc1dedeb8f8a6"
  }, {
    "url": "windows11/SplashScreen.scale-150.png",
    "revision": "1994d659e6e104d35da587db7d477b1b"
  }, {
    "url": "windows11/SplashScreen.scale-200.png",
    "revision": "377e02a85529840a3091be35fe905353"
  }, {
    "url": "windows11/SplashScreen.scale-400.png",
    "revision": "df0f1f138a82fe31f3087d4959d8e1ed"
  }, {
    "url": "windows11/Square150x150Logo.scale-100.png",
    "revision": "816fc3f018602c9034669d73dc5e7274"
  }, {
    "url": "windows11/Square150x150Logo.scale-125.png",
    "revision": "e20c86dc7072ada237cf1f5d2754c679"
  }, {
    "url": "windows11/Square150x150Logo.scale-150.png",
    "revision": "0c9ed1c8d59ff9fce35edd7829388b40"
  }, {
    "url": "windows11/Square150x150Logo.scale-200.png",
    "revision": "e9c413e2b9976a0aa27b75ac6801cfc9"
  }, {
    "url": "windows11/Square150x150Logo.scale-400.png",
    "revision": "c48cfe653851087de4c78cbe01779e51"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-16.png",
    "revision": "83d046283bc7476867a43fad1b0686e3"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-20.png",
    "revision": "de42a5c385cb5a684e967a2dcfd231b6"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-24.png",
    "revision": "f214d8c97cafca9104fbf84a5cf89d3c"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-256.png",
    "revision": "294b15ea4cc55da0af8bb92a7a045bc7"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-30.png",
    "revision": "9c7e4d0db20131f9a899ef69c2c88112"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-32.png",
    "revision": "a7eb110fe20228a554647f24f9783056"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-36.png",
    "revision": "d1b57bc467c37977c841e314fa65d22a"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-40.png",
    "revision": "22a2803cfbcc47a5dfbd046c255fdb5a"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-44.png",
    "revision": "c2e72f42d07b16e531836f652afd3568"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-48.png",
    "revision": "c21a2bff2fb1cdd3aed56cc502fad5f1"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-60.png",
    "revision": "c1eb6a86c30a4b33a18c46b5b120b79c"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-64.png",
    "revision": "27054111bb780e14422e3b0d601ef79d"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-72.png",
    "revision": "7acbe2b41cb16e779f68f24b643f4441"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-80.png",
    "revision": "ffa01d7b039a36b56dbbe8d7dfe6e9a7"
  }, {
    "url": "windows11/Square44x44Logo.altform-lightunplated_targetsize-96.png",
    "revision": "6bae93d02343859e1ee7ed1225a7fad5"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-16.png",
    "revision": "83d046283bc7476867a43fad1b0686e3"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-20.png",
    "revision": "de42a5c385cb5a684e967a2dcfd231b6"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-24.png",
    "revision": "f214d8c97cafca9104fbf84a5cf89d3c"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-256.png",
    "revision": "294b15ea4cc55da0af8bb92a7a045bc7"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-30.png",
    "revision": "9c7e4d0db20131f9a899ef69c2c88112"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-32.png",
    "revision": "a7eb110fe20228a554647f24f9783056"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-36.png",
    "revision": "d1b57bc467c37977c841e314fa65d22a"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-40.png",
    "revision": "22a2803cfbcc47a5dfbd046c255fdb5a"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-44.png",
    "revision": "c2e72f42d07b16e531836f652afd3568"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-48.png",
    "revision": "c21a2bff2fb1cdd3aed56cc502fad5f1"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-60.png",
    "revision": "c1eb6a86c30a4b33a18c46b5b120b79c"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-64.png",
    "revision": "27054111bb780e14422e3b0d601ef79d"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-72.png",
    "revision": "7acbe2b41cb16e779f68f24b643f4441"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-80.png",
    "revision": "ffa01d7b039a36b56dbbe8d7dfe6e9a7"
  }, {
    "url": "windows11/Square44x44Logo.altform-unplated_targetsize-96.png",
    "revision": "6bae93d02343859e1ee7ed1225a7fad5"
  }, {
    "url": "windows11/Square44x44Logo.scale-100.png",
    "revision": "c2e72f42d07b16e531836f652afd3568"
  }, {
    "url": "windows11/Square44x44Logo.scale-125.png",
    "revision": "d1ab234fe1efd66f720e81076c837b31"
  }, {
    "url": "windows11/Square44x44Logo.scale-150.png",
    "revision": "ffd0fa542ec0db31a4066fb9089c28bc"
  }, {
    "url": "windows11/Square44x44Logo.scale-200.png",
    "revision": "337fab9534139e2121b87fc6b20192cd"
  }, {
    "url": "windows11/Square44x44Logo.scale-400.png",
    "revision": "2793295921a8960efbd4feb2cf214379"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-16.png",
    "revision": "83d046283bc7476867a43fad1b0686e3"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-20.png",
    "revision": "de42a5c385cb5a684e967a2dcfd231b6"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-24.png",
    "revision": "f214d8c97cafca9104fbf84a5cf89d3c"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-256.png",
    "revision": "294b15ea4cc55da0af8bb92a7a045bc7"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-30.png",
    "revision": "9c7e4d0db20131f9a899ef69c2c88112"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-32.png",
    "revision": "a7eb110fe20228a554647f24f9783056"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-36.png",
    "revision": "d1b57bc467c37977c841e314fa65d22a"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-40.png",
    "revision": "22a2803cfbcc47a5dfbd046c255fdb5a"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-44.png",
    "revision": "c2e72f42d07b16e531836f652afd3568"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-48.png",
    "revision": "c21a2bff2fb1cdd3aed56cc502fad5f1"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-60.png",
    "revision": "c1eb6a86c30a4b33a18c46b5b120b79c"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-64.png",
    "revision": "27054111bb780e14422e3b0d601ef79d"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-72.png",
    "revision": "7acbe2b41cb16e779f68f24b643f4441"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-80.png",
    "revision": "ffa01d7b039a36b56dbbe8d7dfe6e9a7"
  }, {
    "url": "windows11/Square44x44Logo.targetsize-96.png",
    "revision": "6bae93d02343859e1ee7ed1225a7fad5"
  }, {
    "url": "windows11/StoreLogo.scale-100.png",
    "revision": "181243962ecdc6774675488033a517b1"
  }, {
    "url": "windows11/StoreLogo.scale-125.png",
    "revision": "eca4cbe04e772fa38b4f2ff0959e2c2d"
  }, {
    "url": "windows11/StoreLogo.scale-150.png",
    "revision": "8cdf4bdf9fc6c297e57e740833076920"
  }, {
    "url": "windows11/StoreLogo.scale-200.png",
    "revision": "a3a17d03242cf57d040e87faefc441d1"
  }, {
    "url": "windows11/StoreLogo.scale-400.png",
    "revision": "256befd5ae9f0c5c2ca9f4dc01f8e748"
  }, {
    "url": "windows11/Wide310x150Logo.scale-100.png",
    "revision": "5f907b525aa2b736c157087f76d56343"
  }, {
    "url": "windows11/Wide310x150Logo.scale-125.png",
    "revision": "30c748d58c3e172ca8c73cff9bbad0d4"
  }, {
    "url": "windows11/Wide310x150Logo.scale-150.png",
    "revision": "4136ecb5f3cafb20ca1e1381a02cdedf"
  }, {
    "url": "windows11/Wide310x150Logo.scale-200.png",
    "revision": "f37ed1262d0a6cda0e7329cb433bddaf"
  }, {
    "url": "windows11/Wide310x150Logo.scale-400.png",
    "revision": "377e02a85529840a3091be35fe905353"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "a4e79da125ea1a9ca166bf34d3bdbeff"
  }, {
    "url": "pwa-192x192.png",
    "revision": "2675ed4d695f203ff0d3f93d183ecb3c"
  }, {
    "url": "pwa-512x512.png",
    "revision": "73a2bd1d15c5050cc7e393b13c03ef52"
  }, {
    "url": "android/android-launchericon-144-144.png",
    "revision": "137faa2a0f7dbc8117511eb7c2e2e534"
  }, {
    "url": "android/android-launchericon-96-96.png",
    "revision": "2c6f3cdd5d43e053f3ce9ca275d1de4f"
  }, {
    "url": "android/android-launchericon-72-72.png",
    "revision": "227a2d612ba5cdc9f971d1ab577db4d0"
  }, {
    "url": "android/android-launchericon-48-48.png",
    "revision": "224503e0fb8d9745178cdafd21a3d40a"
  }, {
    "url": "ios/180.png",
    "revision": "a4e79da125ea1a9ca166bf34d3bdbeff"
  }, {
    "url": "ios/192.png",
    "revision": "2675ed4d695f203ff0d3f93d183ecb3c"
  }, {
    "url": "ios/256.png",
    "revision": "99b5928aa74e906a14e6cef8432ffd2e"
  }, {
    "url": "ios/512.png",
    "revision": "73a2bd1d15c5050cc7e393b13c03ef52"
  }, {
    "url": "ios/1024.png",
    "revision": "3951938fbb7afcedb57c66af453637fd"
  }, {
    "url": "manifest.webmanifest",
    "revision": "420e23a59b288d4043f04e56c7ed5e6f"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/.*\.supabase\.co\/.*/i, new workbox.NetworkFirst({
    "cacheName": "supabase-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');

}));
