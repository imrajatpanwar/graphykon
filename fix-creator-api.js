// Script to fix hardcoded localhost URLs in creator components
// This will be used to update the components

const replacements = [
  // CreatorDashboard.js
  {
    file: 'frontend/src/components/creator/CreatorDashboard.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/creator/profile'",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/creator/profile`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/creator/assets'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/creator/assets`"
      },
      {
        from: "const response = await axios.get(`http://localhost:5000/api/auth/user/${currentUserId}`",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/auth/user/${currentUserId}`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/monetization/overview'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/overview`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/monetization/earnings-history'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/earnings-history`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/monetization/assets-summary'",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/monetization/assets-summary`"
      },
      {
        from: "await axios.put(\n        'http://localhost:5000/api/creator/profile'",
        to: "const apiConfig = getApiConfig();\n      await axios.put(\n        `${apiConfig.baseURL}/api/creator/profile`"
      },
      {
        from: "await axios.post('http://localhost:5000/api/creator/upload-asset'",
        to: "const apiConfig = getApiConfig();\n      await axios.post(`${apiConfig.baseURL}/api/creator/upload-asset`"
      },
      {
        from: "const res = await axios.put('http://localhost:5000/api/creator/profile/cover-image'",
        to: "const apiConfig = getApiConfig();\n      const res = await axios.put(`${apiConfig.baseURL}/api/creator/profile/cover-image`"
      }
    ]
  },
  
  // CreatorPublicProfile.js
  {
    file: 'frontend/src/components/creator/CreatorPublicProfile.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`http://localhost:5000/api/creator/public/${username}`);",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/creator/public/${username}`);"
      },
      {
        from: "const response = await axios.get(`http://localhost:5000/api/reviews/${username}`);",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/reviews/${username}`);"
      },
      {
        from: "await axios.post(\n        `http://localhost:5000/api/creator/${endpoint}/${username}`",
        to: "const apiConfig = getApiConfig();\n      await axios.post(\n        `${apiConfig.baseURL}/api/creator/${endpoint}/${username}`"
      },
      {
        from: "const response = await axios.post(\n        `http://localhost:5000/api/messages/conversations/start`",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.post(\n        `${apiConfig.baseURL}/api/messages/conversations/start`"
      },
      {
        from: "const response = await axios.post(\n        `http://localhost:5000/api/reviews`",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.post(\n        `${apiConfig.baseURL}/api/reviews`"
      },
      {
        from: "backgroundImage: `url(http://localhost:5000/${creator.coverImage})`",
        to: "backgroundImage: `url(${getApiConfig().baseURL}/${creator.coverImage})`"
      },
      {
        from: "src={creator.profileImage ? `http://localhost:5000/${creator.profileImage}` : 'https://via.placeholder.com/120'}",
        to: "src={creator.profileImage ? `${getApiConfig().baseURL}/${creator.profileImage}` : 'https://via.placeholder.com/120'}"
      },
      {
        from: "src={`http://localhost:5000/${asset.showcaseImages[0]}`}",
        to: "src={`${getApiConfig().baseURL}/${asset.showcaseImages[0]}`}"
      }
    ]
  },
  
  // Creator.js
  {
    file: 'frontend/src/components/creator/Creator.js',
    changes: [
      {
        from: "import axios from 'axios';",
        to: "import axios from 'axios';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.post(\n          'http://localhost:5000/api/creator/check-username'",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.post(\n          `${apiConfig.baseURL}/api/creator/check-username`"
      },
      {
        from: "const response = await axios.get('http://localhost:5000/api/creator/profile'",
        to: "const apiConfig = getApiConfig();\n        const response = await axios.get(`${apiConfig.baseURL}/api/creator/profile`"
      },
      {
        from: "setPreviewImage(`http://localhost:5000/${profileImage}`);",
        to: "setPreviewImage(`${getApiConfig().baseURL}/${profileImage}`);"
      },
      {
        from: "await axios.put(\n        'http://localhost:5000/api/creator/profile'",
        to: "const apiConfig = getApiConfig();\n      await axios.put(\n        `${apiConfig.baseURL}/api/creator/profile`"
      },
      {
        from: "setPreviewImage(`http://localhost:5000/${response.data.profileImage}`);",
        to: "setPreviewImage(`${getApiConfig().baseURL}/${response.data.profileImage}`);"
      }
    ]
  }
];

console.log('API Fix Script - Replacements needed:');
replacements.forEach((fileConfig, index) => {
  console.log(`\n${index + 1}. ${fileConfig.file}:`);
  fileConfig.changes.forEach((change, changeIndex) => {
    console.log(`   ${changeIndex + 1}. Replace: ${change.from.substring(0, 50)}...`);
  });
}); 