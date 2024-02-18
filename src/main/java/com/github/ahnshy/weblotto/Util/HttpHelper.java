package com.github.ahnshy.weblotto.Util;

import org.apache.commons.io.FileUtils;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;

public class HttpHelper {
    public void fileDown(String url, String fileName) throws MalformedURLException, IOException {
        File f = new File(fileName);
        FileUtils.copyURLToFile(new URL(url), f);
    }
}
