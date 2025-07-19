// Comprehensive script to fix all remaining frontend API calls
// This will be used to update all components systematically

const remainingFixes = [
  // Navbar.js
  {
    file: 'frontend/src/components/common/Navbar.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/creator/profile'",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/creator/profile`"
      }
    ]
  },

  // Pricing.js
  {
    file: 'frontend/src/components/pricing/Pricing.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/pricing/plans');",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/pricing/plans`);"
      },
      {
        from: "'http://localhost:5000/api/auth/upgrade-premium',",
        to: "`${getApiConfig().baseURL}/api/auth/upgrade-premium`,"
      }
    ]
  },

  // Messages.js
  {
    file: 'frontend/src/components/messages/Messages.js',
    changes: [
      {
        from: "import io from 'socket.io-client';",
        to: "import io from 'socket.io-client';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const newSocket = io('http://localhost:5000');",
        to: "const apiConfig = getApiConfig();\n    const newSocket = io(apiConfig.socketURL);"
      }
    ]
  },

  // MessageTest.js
  {
    file: 'frontend/src/components/messages/MessageTest.js',
    changes: [
      {
        from: "const socket = new WebSocket('ws://localhost:5000');",
        to: "const apiConfig = getApiConfig();\n    const socket = new WebSocket(apiConfig.socketURL.replace('http', 'ws'));"
      }
    ]
  },

  // AdminMessages.js
  {
    file: 'frontend/src/components/admin/AdminMessages.js',
    changes: [
      {
        from: "import io from 'socket.io-client';",
        to: "import io from 'socket.io-client';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const newSocket = io('http://localhost:5000');",
        to: "const apiConfig = getApiConfig();\n    const newSocket = io(apiConfig.socketURL);"
      }
    ]
  },

  // AdminTrending.js
  {
    file: 'frontend/src/components/admin/AdminTrending.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`http://localhost:5000/api/admin/trending/manage`",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/trending/manage`"
      },
      {
        from: "`http://localhost:5000/api/admin/trending/add/${selectedAsset._id}`",
        to: "`${getApiConfig().baseURL}/api/admin/trending/add/${selectedAsset._id}`"
      },
      {
        from: "`http://localhost:5000/api/admin/trending/remove/${selectedAsset._id}`",
        to: "`${getApiConfig().baseURL}/api/admin/trending/remove/${selectedAsset._id}`"
      },
      {
        from: "src={asset.showcaseImages?.[0] ? `http://localhost:5000/${asset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}",
        to: "src={asset.showcaseImages?.[0] ? `${getApiConfig().baseURL}/${asset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}"
      },
      {
        from: "src={selectedAsset.showcaseImages?.[0] ? `http://localhost:5000/${selectedAsset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}",
        to: "src={selectedAsset.showcaseImages?.[0] ? `${getApiConfig().baseURL}/${selectedAsset.showcaseImages[0]}` : 'https://via.placeholder.com/60x40?text=No+Image'}"
      }
    ]
  },

  // AdminPricing.js
  {
    file: 'frontend/src/components/admin/AdminPricing.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/pricing/admin/plans'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/pricing/admin/plans`"
      },
      {
        from: "? `http://localhost:5000/api/pricing/admin/plans/${editingPlan._id}`",
        to: "? `${getApiConfig().baseURL}/api/pricing/admin/plans/${editingPlan._id}`"
      },
      {
        from: ": 'http://localhost:5000/api/pricing/admin/plans';",
        to: ": `${getApiConfig().baseURL}/api/pricing/admin/plans`;"
      },
      {
        from: "await axios.delete(`http://localhost:5000/api/pricing/admin/plans/${planId}`",
        to: "await axios.delete(`${getApiConfig().baseURL}/api/pricing/admin/plans/${planId}`"
      },
      {
        from: "await axios.post('http://localhost:5000/api/pricing/admin/initialize'",
        to: "await axios.post(`${getApiConfig().baseURL}/api/pricing/admin/initialize`"
      }
    ]
  },

  // AdminMonetization.js
  {
    file: 'frontend/src/components/admin/AdminMonetization.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/monetization/admin/overview'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/admin/overview`"
      },
      {
        from: "const response = await axios.get(`http://localhost:5000/api/monetization/admin/earnings?${params}`",
        to: "const response = await axios.get(`${getApiConfig().baseURL}/api/monetization/admin/earnings?${params}`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/monetization/admin/creators-summary'",
        to: "const response = await axios.get(`${getApiConfig().baseURL}/api/monetization/admin/creators-summary`"
      },
      {
        from: "`http://localhost:5000/api/monetization/admin/earnings/${earningId}`",
        to: "`${getApiConfig().baseURL}/api/monetization/admin/earnings/${earningId}`"
      }
    ]
  }
];

console.log('Comprehensive Frontend API Fix Script');
console.log('=====================================');
console.log(`Total files to fix: ${remainingFixes.length}`);
console.log('\nFiles that need updating:');
remainingFixes.forEach((fileConfig, index) => {
  console.log(`\n${index + 1}. ${fileConfig.file}:`);
  console.log(`   Changes needed: ${fileConfig.changes.length}`);
  fileConfig.changes.forEach((change, changeIndex) => {
    console.log(`   ${changeIndex + 1}. ${change.from.substring(0, 50)}...`);
  });
});

console.log('\nInstructions:');
console.log('1. Apply these changes to each file');
console.log('2. Test the application after each file');
console.log('3. Commit changes in batches');
console.log('4. Deploy to server and test'); 