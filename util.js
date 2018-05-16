function checkIsType(obj, type, varName = "Argument")
{
    if(typeof(obj) != type)
    {
        throw new Error(varName + " is not of type " + type);
    }
}

function checkIsInteger(obj, varName = "Argument")
{
    if(!Number.isInteger(obj))
    {
        throw new Error(varName + " is not an integer");
    }
}

module.exports =
{
    checkIsType,
    checkIsInteger
}