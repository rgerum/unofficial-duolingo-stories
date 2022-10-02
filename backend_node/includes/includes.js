function func_catch(func) {
    return async (req, res) => {
        try {
            let data = await func({...req.params, ...req.session});
            if(data?.status) {
                return res.status(data.status).json(data);
            }
            else if(data === undefined) {
                return res.status(404).json({});
            }
            else
                res.json(data);
        }
        catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
}

module.exports = {func_catch: func_catch};
