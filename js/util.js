/***
 * util.js
 * - utility functions
 * @created 2016/06/07 by macocci7
 */

    function getFunctionName() {
        return getFunctionName.caller.name;
    }
    
    function getDirName(stPath) {
        return stPath.split('/').reverse().slice(1).reverse().join('/')+'/';
    }
    
    function escapeHtml(str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;');
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/"/g, '&quot;');
        str = str.replace(/'/g, '&#39;');
        return str;
    }
