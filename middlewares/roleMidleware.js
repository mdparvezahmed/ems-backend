module.exports = function(...requiredRoles){
    return function(req, res, next){
        if (!req.user || !requiredRoles.includes(req.user.role)){
            return res.status(403).json({
                message: "access denied: you ar not authorized"
            });
        }
        next();
    }
}