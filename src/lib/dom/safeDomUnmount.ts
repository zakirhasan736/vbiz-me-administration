/**
 * Google Translate / password managers wrap React text nodes. React 19 then
 * calls parent.removeChild(child) when child is no longer a child of parent.
 * Guard those DOM ops before React hydrates.
 */
export const SAFE_DOM_UNMOUNT_BOOTSTRAP = `(function(){try{if(typeof Node!=='function'||!Node.prototype||Node.prototype.__vbizDomGuard)return;Node.prototype.__vbizDomGuard=1;var remove=Node.prototype.removeChild;Node.prototype.removeChild=function(child){if(!child||child.parentNode!==this)return child;return remove.call(this,child)};var insert=Node.prototype.insertBefore;Node.prototype.insertBefore=function(node,ref){if(ref&&ref.parentNode!==this)return node;return insert.call(this,node,ref)};}catch(e){}})();`

declare global {
  interface Node {
    __vbizDomGuard?: number
  }
}
