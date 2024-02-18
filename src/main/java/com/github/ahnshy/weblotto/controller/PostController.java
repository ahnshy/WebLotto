package com.github.ahnshy.weblotto.controller;

import com.github.ahnshy.weblotto.model.SearchParam;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api") // %SERVER_URL%/api
public class PostController {

    @RequestMapping(method = RequestMethod.POST, path = "/postMethod2")
    public String postMethod2(){
        return  "Post2 RESPONSE SUCCESS.";
    }

    @PostMapping(value = "/postMethod") // %SERVER_URL%/api/postMethod
    public SearchParam postMethod(@RequestBody SearchParam param){
        return  param;
    }

    @PutMapping("/putMethod")
    public void put() {
    }

    @PatchMapping("/patchMethod")
    public void patch() {

    }
}
