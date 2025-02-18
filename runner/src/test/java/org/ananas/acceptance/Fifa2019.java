package org.ananas.acceptance;

import com.jayway.jsonpath.JsonPath;
import org.ananas.acceptance.helper.AcceptanceForkJoinThreadFactory;
import org.ananas.cli.Main;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.contrib.java.lang.system.*;

import java.net.URL;
import java.util.List;
import java.util.Map;

public class Fifa2019 {
  @Rule
  public final ExpectedSystemExit exit = ExpectedSystemExit.none();

  @Rule
  public final SystemOutRule systemOutRule = new SystemOutRule().enableLog();

  @Rule
  public final ProvideSystemProperty filesToStage
    = new ProvideSystemProperty("filesToStage", "mock.jar");

  @Rule
  public final ProvideSystemProperty threadFactory
    = new ProvideSystemProperty("java.util.concurrent.ForkJoinPool.common.threadFactory", AcceptanceForkJoinThreadFactory.class.getName());

  @Test
  public void exploreDataSource() {
    exit.expectSystemExitWithStatus(0);

    exit.checkAssertionAfterwards(new Assertion() {
      public void checkAssertion() {
        String json = systemOutRule.getLog();
        int code = JsonPath.read(json, "$.code");
        Assert.assertEquals(200, code);

        List<Map<String, String>> fields = JsonPath.read(json, "$.data.schema.fields");
        Assert.assertTrue(fields.size() > 0);
      }
    });

    ClassLoader classLoader = getClass().getClassLoader();
    URL project = classLoader.getResource("test_projects/Fifa2019");

    Main.main(new String[]{
      "explore",
      "-p",
      project.getPath(),
      "5d31c71a84b5674b6a220288",
      "-n",
      "0",
      "--size",
      "5"
    });
  }

  @Test
  public void testTransformer() {
    exit.expectSystemExitWithStatus(0);

    exit.checkAssertionAfterwards(new Assertion() {
      public void checkAssertion() {
        String json = systemOutRule.getLog();
        int code = JsonPath.read(json, "$.code");
        Assert.assertEquals(200, code);

        List<Map<String, String>> fields = JsonPath.read(json, "$.data.5d31cb6684b5674b6a22028c.schema.fields");
        Assert.assertTrue(fields.size() > 0);

        List<Object> data = JsonPath.read(json, "$.data.5d31cb6684b5674b6a22028c.data");
        Assert.assertTrue(data.size() > 0);
      }
    });

    // run command line with arguments
    ClassLoader classLoader = getClass().getClassLoader();
    URL project = classLoader.getResource("test_projects/Fifa2019");

    Main.main(new String[]{
      "test",
      "-p",
      project.getPath(),
      "5d31cb6684b5674b6a22028c",
    });
  }

  @Test
  public void testConcatStep() {
    exit.expectSystemExitWithStatus(0);

    exit.checkAssertionAfterwards(new Assertion() {
      public void checkAssertion() {
        String json = systemOutRule.getLog();
        int code = JsonPath.read(json, "$.code");
        Assert.assertEquals(200, code);

        List<Map<String, String>> fields = JsonPath.read(json, "$.data.5d31d45184b5674b6a2202c2.schema.fields");
        Assert.assertTrue(fields.size() > 0);

        List<Object> data = JsonPath.read(json, "$.data.5d31d45184b5674b6a2202c2.data");
        Assert.assertTrue(data.size() > 0);
      }
    });

    // run command line with arguments
    ClassLoader classLoader = getClass().getClassLoader();
    URL project = classLoader.getResource("test_projects/Fifa2019");

    Main.main(new String[]{
      "test",
      "-p",
      project.getPath(),
      "5d31d45184b5674b6a2202c2",
    });
  }

  @Test
  public void testRun() {
    exit.expectSystemExitWithStatus(0);

    exit.checkAssertionAfterwards(new Assertion() {
      public void checkAssertion() {
        String output = systemOutRule.getLog();
        // TODO: test stdout here
      }
    });

    // run command line with arguments
    ClassLoader classLoader = getClass().getClassLoader();
    URL project = classLoader.getResource("test_projects/Fifa2019");

    Main.main(new String[]{
      "run",
      "-p",
      project.getPath(),
      "5d31cdb684b5674b6a220299",
    });
  }

}
