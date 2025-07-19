// Script to fix remaining admin components with relative URLs

const replacements = [
  // AdminReviews.js
  {
    file: 'frontend/src/components/admin/AdminReviews.js',
    changes: [
      {
        from: "import React, { useState, useEffect, useCallback } from 'react';",
        to: "import React, { useState, useEffect, useCallback } from 'react';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`/api/admin/reviews?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/reviews?${queryParams}`, {"
      }
    ]
  },
  
  // AdminGraphs.js
  {
    file: 'frontend/src/components/admin/AdminGraphs.js',
    changes: [
      {
        from: "import React, { useState, useEffect, useCallback } from 'react';",
        to: "import React, { useState, useEffect, useCallback } from 'react';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`/api/admin/graphs?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/graphs?${queryParams}`, {"
      }
    ]
  },
  
  // AdminCreators.js
  {
    file: 'frontend/src/components/admin/AdminCreators.js',
    changes: [
      {
        from: "import React, { useState, useEffect, useCallback } from 'react';",
        to: "import React, { useState, useEffect, useCallback } from 'react';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`/api/admin/users?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/users?${queryParams}`, {"
      }
    ]
  },
  
  // AdminCopyrightAppeals.js
  {
    file: 'frontend/src/components/admin/AdminCopyrightAppeals.js',
    changes: [
      {
        from: "import React, { useState, useEffect, useCallback } from 'react';",
        to: "import React, { useState, useEffect, useCallback } from 'react';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`/api/admin/copyright-appeals?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/copyright-appeals?${queryParams}`, {"
      },
      {
        from: "const response = await axios.get(`/api/admin/copyright-appeals/export?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/copyright-appeals/export?${queryParams}`, {"
      }
    ]
  },
  
  // AdminAssets.js
  {
    file: 'frontend/src/components/admin/AdminAssets.js',
    changes: [
      {
        from: "import React, { useState, useEffect, useCallback } from 'react';",
        to: "import React, { useState, useEffect, useCallback } from 'react';\nimport getApiConfig from '../../config/api';"
      },
      {
        from: "const response = await axios.get(`/api/admin/assets?${queryParams}`, {",
        to: "const apiConfig = getApiConfig();\n      const response = await axios.get(`${apiConfig.baseURL}/api/admin/assets?${queryParams}`, {"
      }
    ]
  }
];

console.log('Admin components to fix:', replacements.length); 